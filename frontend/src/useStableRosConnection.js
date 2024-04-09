
import { useRef } from 'react';
import ROSLIB from 'roslib';


const useStableRosConnection = (url) => {
  const rosRef = useRef(null);
  if (!rosRef.current) {
    rosRef.current = new ROSLIB.Ros({ url });
  }
  return rosRef.current;
};

export default useStableRosConnection;
