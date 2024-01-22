const BACKEND_URI = "http://localhost:8080";

const App = () => (
    <button onClick={
        () => {
            fetch(BACKEND_URI + "/tiago_state")
                .then(response => response.json().then((json) => {
                    console.log(json);
                    alert(`GET /example and got response: ${JSON.stringify(json)}`);
                }))
                .catch(err => console.log(err));
        }}
    >Click me!</button>
);

export default App;
