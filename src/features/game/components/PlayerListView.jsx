import AdminPopup from "./popups/AdminPopup";

function PlayerListView({ players, teamId, teamClass, joinLabel, showReset, isAdmin, gameStarted, teamsLocked, room, showPopup }) {
  const teamPlayers = players.filter(p => p.team.id === teamId);
  const dragStart = (e, playerId) => {
    e.dataTransfer.setData('movePlayer', playerId)
  }

  const dropped = (e) => {
    const playerId = e.dataTransfer.getData('movePlayer')
    console.log(e)
    if (e.target.parentElement.className.includes('t-red')) {
      room.setPlayerTeam(playerId, 1)
    } else if (e.target.parentElement.className.includes('t-blue')) {
      room.setPlayerTeam(playerId, 2)
    } else if (e.target.parentElement.className.includes('t-spec')) {
      room.setPlayerTeam(playerId, 0)
    }
  }

  const handleContextMenu = (e, playerId) => {
    e.preventDefault()
    const clickedPlayer = room.getPlayer(playerId)
    showPopup(<AdminPopup room={room} player={room.currentPlayer} clickedPlayer={clickedPlayer} showPopup={showPopup}/>)
  }

  return (
    <div className={`player-list-view ${teamClass}`}>
      <div className="buttons">
        <button
          data-hook="join-btn"
          disabled={gameStarted || teamsLocked}
          onClick={() => room.changeTeam(teamId)}
        >
          {joinLabel}
        </button>
        {showReset && (
          <button
            data-hook="reset-btn"
            hidden={!isAdmin}
            disabled={gameStarted || !isAdmin}
            onClick={() => room.resetTeam(teamId)}
          />
        )}
      </div>
      <div className="list thin-scrollbar" data-hook="list" onDragOver={(e) => e.preventDefault()} onDrop={dropped}>
        {teamPlayers.map((p) => (
          <div key={p.id} onContextMenu={(e)=>handleContextMenu(e, p.id)} onDragStart={(e)=>dragStart(e,p.id)} className={`player-list-item${p.isAdmin ? ' admin' : ''}`} draggable={isAdmin}>
            <div data-hook="flag" className={`flagico f-${p.flag}`}></div>
            <div data-hook="name">{p.name}</div>
            <div data-hook="ping">{p.ping}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerListView;