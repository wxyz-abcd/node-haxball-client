const { Utils } = window.API;

export async function getRooms(geo) {
  const roomList = await Utils.getRoomList();
  Utils.calculateAllRoomDistances(geo, roomList);
  return roomList.sort((a, b) => a.dist - b.dist);
}