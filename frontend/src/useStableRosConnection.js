
import { useRef } from 'react';
import ROSLIB from 'roslib';

// This hook ensures that a single ROS connection is maintained throughout the component's lifecycle.
const useStableRosConnection = (url) => {
  const rosRef = useRef(null);
  if (!rosRef.current) {
    rosRef.current = new ROSLIB.Ros({ url });
  }
  return rosRef.current;
};

export default useStableRosConnection;
