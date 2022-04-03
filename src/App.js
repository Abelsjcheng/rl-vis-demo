
import React from 'react';
import Main from './components/Main.js'
//import kobe_bryant from './case/kg.json'
import James_jason_train_subKg from './case/lebron_james_train/James_jason_train_subKg.json'
import kobe_test_kg from "./case/kobe_bryant_test/kobe_bryant_subKg.json"
function App() {
  return (
    <div className="App">
      <Main kgData={James_jason_train_subKg} sourceNode={kobe_test_kg.nodes[0]} ></Main>
    </div>
  );
}

export default App;
