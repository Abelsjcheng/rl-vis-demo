
import React from 'react';
import Kg from '../components/Kg.js'
import pau_gasol_train_kg from '../case/pau_gasol_train/pau_gasol_train_kg.json'
import SidePanel from '../components/SidePanel.js'

const cases = [
    {
        sourceEntity: "concept_coach_lebron_james",
        relation: "concept:athleteplaysinleague",
        targetEntity: "concept_sportsleague_nba"
    },
    {
        sourceEntity: "concept_personus_kobe_bryant",
        relation: "concept:athleteplaysinleague",
        targetEntity: "concept_sportsleague_nba"
    },
    {
        sourceEntity: "concept_athlete_pau_gasol",
        relation: "concept:athleteplaysinleague",
        targetEntity: "concept_sportsleague_nba"
    }
]
class IndexPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            kgData: pau_gasol_train_kg,
            caseTriple: cases[2],
            kgRef: null
        };
    }
    handelStateChange(nextstates) {
        for (let key in nextstates) {
            if (key === "caseTriple") {
                nextstates[key] = cases[nextstates[key]]
            }
        }
        this.setState(nextstates)
    }
    render() {
        const { kgData, caseTriple, kgRef } = this.state
        return (
            <div className="App">
                <div className="rl-view">
                    <div className="rl-view-sider">
                        <SidePanel getKgRef={kgRef} kgData={kgData} caseTriple={caseTriple} getStateChange={this.handelStateChange.bind(this)} ></SidePanel>
                    </div>
                    <div className="rl-view-content">
                        <Kg onRef={ref => (this.setState({ kgRef: ref }))} kgData={kgData} caseTriple={caseTriple} ></Kg>
                    </div>
                </div>
            </div>
        );
    }
}


export default IndexPage;
