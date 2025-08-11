function PlayerListView({ players, teamId, teamClass, joinLabel, showReset, isAdmin, gameStarted, teamsLocked, room }) {
  const teamPlayers = players.filter(p => p.team.id === teamId);
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
      <div className="list thin-scrollbar" data-hook="list">
        {teamPlayers.map((p) => (
          <div key={p.id} className={`player-list-item${p.isAdmin ? ' admin' : ''}`} draggable>
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