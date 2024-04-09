

import ROSLIB from "roslib";
// import ROS2D from "ros2d";

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

let currentPolygonMarker = null;

export function addGoalMarker(viewer, goalX, goalY) {

    if (!viewer || !viewer.scene) {
        console.error("Viewer or its scene is not initialized.");
        return;
    }

    if (currentPolygonMarker) {
        viewer.scene.removeChild(currentPolygonMarker);
    }

    const polygonOptions = {
        lineSize: 0.3,
        lineColor: window.createjs.Graphics.getRGB(0, 0, 255, 0.66), // Blue lines
        pointSize: 0.1,
        pointColor: window.createjs.Graphics.getRGB(255, 0, 0, 0.66), // Red points
        fillColor: window.createjs.Graphics.getRGB(0, 255, 0, 0.33) // Green fill
    };

    var polygonMarker = new window.ROS2D.PolygonMarker(polygonOptions);
    viewer.scene.addChild(polygonMarker);

    // Adding points to define the shape of the goal marker
    polygonMarker.addPoint(new ROSLIB.Vector3({x: goalX, y: goalY + 0.1}));
    polygonMarker.addPoint(new ROSLIB.Vector3({x: goalX + 0.1, y: goalY}));
    polygonMarker.addPoint(new ROSLIB.Vector3({x: goalX, y: goalY - 0.1}));
    polygonMarker.addPoint(new ROSLIB.Vector3({x: goalX - 0.1, y: goalY}));

    // Drawing the filled area
    polygonMarker.drawFill();

    currentPolygonMarker = polygonMarker;

    //viewer.currentGoalMarker = polygonMarker;
}

