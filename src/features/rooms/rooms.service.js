const { Utils } = window.API;

export async function getRooms() {
  const geo = await Utils.getGeo();
  const roomList = await Utils.getRoomList();
  Utils.calculateAllRoomDistances(geo, roomList);
  return roomList.sort((a, b) => a.dist - b.dist);
}