

export function getRotationFromQuaternion(q) {
    const yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
    return 360 - (yaw * (180 / Math.PI));
}


export function screenToMapCoordinates(pixelX, pixelY, originX, originY, mapResolution) {
    const originXInPixels = originX / mapResolution;
    const originYInPixels = originY / mapResolution;

    const mapX = ((pixelX - originXInPixels) * mapResolution)/100;
    const mapY = ((originYInPixels - pixelY) * mapResolution)/100; 

    return { mapX, mapY };
}
