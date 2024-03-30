

import React, { useState } from "react";
import RosbridgeStatus from "./RosbridgeStatus";
import RosMapSubscriber from "./RosMapSubscriber"; // Import the RosMapSubscriber component

const App = () => {
    const [currentPage, setCurrentPage] = useState('home');

    const navigateToStatus = () => {
        setCurrentPage('status');
    };

    const navigateToHome = () => {
        setCurrentPage('home');
    };

    return (
        <div>
            {currentPage === 'home' && (
                <div>
                    <h1>Welcome to the Home Page</h1>
                    <button onClick={navigateToStatus}>Go to Status Page</button>
                    <RosMapSubscriber /> {/* Include the map subscriber */}

                </div>
            )}
            {currentPage === 'status' && (
                <div>
                    <RosbridgeStatus />
                    <button onClick={navigateToHome}>Back to Home</button>
                </div>
            )}
        </div>
    );
};

export default App;

