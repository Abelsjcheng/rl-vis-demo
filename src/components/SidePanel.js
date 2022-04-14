
import React from 'react';
import { splitLinkName, splitNodeName } from '../util/tool'
import CalendarChart from './chart/CalendarChart';
import { Button, Row, Col, Timeline, Card, Select, Popconfirm, message } from 'antd';
import { DownCircleOutlined } from '@ant-design/icons';
import pau_gasol_train_kg from '../case/pau_gasol_train/pau_gasol_train_kg.json'
import pau_gasol_tran_0 from "../case/pau_gasol_train/train_path/concept_athlete_pau_gasol_0.json"
import pau_gasol_tran_10 from "../case/pau_gasol_train/train_path/concept_athlete_pau_gasol_10.json"
import pau_gasol_tran_20 from "../case/pau_gasol_train/train_path/concept_athlete_pau_gasol_20.json"
import pau_gasol_tran_30 from "../case/pau_gasol_train/train_path/concept_athlete_pau_gasol_30.json"
import pau_gasol_tran_40 from "../case/pau_gasol_train/train_path/concept_athlete_pau_gasol_40.json"
import pau_gasol_tran_50 from "../case/pau_gasol_train/train_path/concept_athlete_pau_gasol_50.json"
import pau_gasol_tran_60 from "../case/pau_gasol_train/train_path/concept_athlete_pau_gasol_60.json"
import pau_gasol_tran_70 from "../case/pau_gasol_train/train_path/concept_athlete_pau_gasol_70.json"
import james_test_kg from "../case/lebron_james_test/lebron_james_test_subKg.json"
import james_test_path from "../case/lebron_james_test/lebron_james_test_action_space.json"
import kobe_test_kg from "../case/kobe_bryant_test/kobe_bryant_subKg.json"
import kobe_test_path from "../case/kobe_bryant_test/kobe_bryant_test_action_space.json"
import pau_gasol_kg from "../case/pau_gasol_test/pau_gasol_test_Kg.json"
import pau_gasol_path from "../case/pau_gasol_test/pau_gasol_test_action_spaces.json"
const { Option } = Select;
const dataSet = [
    { "dataName": "训练1", pathData: pau_gasol_tran_0, kgData: pau_gasol_train_kg, caseIndex: 2 },
    { "dataName": "训练2", pathData: pau_gasol_tran_10, kgData: pau_gasol_train_kg, caseIndex: 2 },
    { "dataName": "训练3", pathData: pau_gasol_tran_20, kgData: pau_gasol_train_kg, caseIndex: 2 },
    { "dataName": "训练4", pathData: pau_gasol_tran_30, kgData: pau_gasol_train_kg, caseIndex: 2 },
    { "dataName": "训练5", pathData: pau_gasol_tran_40, kgData: pau_gasol_train_kg, caseIndex: 2 },
    { "dataName": "训练6", pathData: pau_gasol_tran_50, kgData: pau_gasol_train_kg, caseIndex: 2 },
    { "dataName": "训练7", pathData: pau_gasol_tran_60, kgData: pau_gasol_train_kg, caseIndex: 2 },
    { "dataName": "训练8", pathData: pau_gasol_tran_70, kgData: pau_gasol_train_kg, caseIndex: 2 },
    { "dataName": "验证集", pathData: james_test_path, kgData: james_test_kg, caseIndex: 0 },
    { "dataName": "验证集2", pathData: pau_gasol_path, kgData: pau_gasol_kg, caseIndex: 2 },
    { "dataName": "测试集", pathData: kobe_test_path, kgData: kobe_test_kg, caseIndex: 1 },
]

class SidePanel extends React.Component {
    constructor(props) {
        super(props);
        this.testStatus = 'start';
        this.pathOrder = 0;
        this.pathGroup = initPathGroup(pau_gasol_tran_0);
        this.state = {
            path: this.pathGroup[0]
        };
    }
    pathStart = () => {
        const { getKgRef } = this.props
        this.testStatus = 'start'
        this.pathOrder = 0
        getKgRef.clearSvg()
        this.inferenceAnimation()
    }
    pathStop = () => {
        this.testStatus = 'stop'
    }
    pathContinue = () => {
        const { getKgRef } = this.props
        this.testStatus = 'continue'
        getKgRef.clearSvg()
        this.inferenceAnimation()
    }
    inferenceAnimation() {
        const { getKgRef, caseTriple } = this.props
        let pathLingth = this.pathGroup.length
        const visPath = async (path) => {
            this.setState({ path: path })
            for (let i = 0; i < path.length; i++) {
                await getKgRef.pathForward(path[i], 1000)
            }
            if (path.slice(-1)[0].et_name === caseTriple.targetEntity) {
                this.testStatus = 'stop'
                message.success('到达目标节点');
            }
            if (++this.pathOrder < pathLingth) {
                if (this.testStatus === 'stop') {
                    return;
                } else {
                    getKgRef.clearSvg()
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    visPath(this.pathGroup[this.pathOrder])
                }
            } else {
                this.pathOrder = 0
                return;
            }
        }

        visPath(this.pathGroup[this.pathOrder])
    }
    handleSelectDataSetChange = (value) => {
        const { getStateChange } = this.props
        if (["验证集","验证集2", "测试集"].indexOf(dataSet[value].dataName) === -1) {
            this.pathGroup = initPathGroup(dataSet[value].pathData);
        } else {
            this.pathGroup = initTestPathGroup(dataSet[value].pathData, dataSet[value].kgData.links);
        }
        this.setState({ path: this.pathGroup[0] })
        getStateChange({ kgData: dataSet[value].kgData, caseTriple: dataSet[value].caseIndex })

    }
    handleSelectPathChange = (value) => {
        this.setState({ path: this.pathGroup[value] })
    }
    onHightLightPath = () => {
        const { getKgRef } = this.props
        getKgRef.handleHightLightPath(this.state.path)
    }
    render() {
        const { path } = this.state
        const { kgData, caseTriple } = this.props
        return (
            <>
                <Row justify="space-around">
                    <Col span={24} className="rl-view-sider-title">知识图谱推理：实体预测</Col>
                    <Col span={24}>
                        给定源实体和查询关系:
                    </Col>
                    <Col span={24}>
                        ({splitNodeName(caseTriple.sourceEntity)}, {splitLinkName(caseTriple.relation)}, ?)
                    </Col>
                    <Col span={24}>
                        预测目标实体: {splitNodeName(caseTriple.targetEntity)}
                    </Col>

                </Row>
                <Row justify="space-around">
                    <Col span={24} className="rl-view-sider-title">模拟训练过程</Col>
                    <Col span={6}>
                        <Button type="primary" onClick={this.pathStart}> 开始</Button>
                    </Col>
                    <Col span={6}>
                        <Button type="primary" onClick={this.pathStop}> 暂停</Button>
                    </Col>
                    <Col span={6}>
                        <Button type="primary" onClick={this.pathContinue}> 继续</Button>
                    </Col>
                </Row>
                <Row justify="space-around">
                    <Col span={24} className="rl-view-sider-title">推理路径</Col>
                    <Col span={24}>
                        <Card title={
                            <>
                                <Select defaultValue={0} style={{ width: 90, marginRight: "10px" }} onChange={this.handleSelectDataSetChange} >
                                    {
                                        dataSet.map((data, index) => {
                                            return (
                                                <Option key={data.dataName} value={index}>
                                                    {data.dataName}
                                                </Option>
                                            )
                                        })
                                    }
                                </Select>
                                <Select defaultValue={0} value={path[0].path_id} style={{ width: 100 }} onChange={this.handleSelectPathChange}>
                                    {

                                        this.pathGroup.map(path => {
                                            return (
                                                <Option key={path[0].path_id} value={path[0].path_id}>
                                                    {
                                                        path[2].et_name === caseTriple.targetEntity ? "路径" + path[0].path_id + "(正确)" : "路径" + path[0].path_id
                                                    }
                                                </Option>
                                            )
                                        })
                                    }
                                </Select>
                            </>
                        }
                            extra={!path[2].path_sorce ? path[2].et_name === caseTriple.targetEntity ? "奖励:1" : "奖励:0" : "评分:" + path[2].path_sorce}
                            bodyStyle={{ padding: "12px" }}
                        >
                            <Row justify="space-around" align="middle" style={{ marginBottom: "20px", textAlign: 'center' }}>
                                <Col span={8}>关系</Col>
                                <Col span={5}> <Button onClick={this.onHightLightPath}>高亮</Button> </Col>
                                <Col span={8}>实体</Col>
                            </Row>
                            <Timeline mode="alternate">
                                <Popconfirm
                                    placement="rightTop"
                                    icon={false}
                                    title={<CalendarChart step={path[0]} nodes={kgData.nodes} links={kgData.links} />}
                                    showCancel={false}
                                >
                                    <Timeline.Item className="timeline-item" >{splitNodeName(path[0].es_name)}</Timeline.Item>
                                </Popconfirm>
                                <Timeline.Item dot={<DownCircleOutlined style={{ fontSize: '16px' }} />} >{splitLinkName(path[0].r_name)}</Timeline.Item>
                                <Popconfirm
                                    placement="rightTop"
                                    icon={false}
                                    title={<CalendarChart step={path[1]} nodes={kgData.nodes} links={kgData.links} />}
                                    showCancel={false}
                                >
                                    <Timeline.Item className="timeline-item" >{splitNodeName(path[0].et_name)}</Timeline.Item>
                                </Popconfirm>
                                <Timeline.Item dot={<DownCircleOutlined style={{ fontSize: '16px' }} />} >{splitLinkName(path[1].r_name)}</Timeline.Item>
                                <Popconfirm
                                    placement="rightTop"
                                    icon={false}
                                    title={<CalendarChart step={path[2]} nodes={kgData.nodes} links={kgData.links} />}
                                    showCancel={false}
                                >
                                    <Timeline.Item className="timeline-item" >{splitNodeName(path[1].et_name)}</Timeline.Item>
                                </Popconfirm>
                                <Timeline.Item dot={<DownCircleOutlined style={{ fontSize: '16px' }} />} >{splitLinkName(path[2].r_name)}</Timeline.Item>
                                <Timeline.Item className="timeline-item">{splitNodeName(path[2].et_name)}</Timeline.Item>
                            </Timeline>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}

function initPathGroup(paths) {
    let pathGroup = []
    for (let path_key in paths) {
        let path = paths[path_key],
            _path = [],
            es_id = path["e0"].e_id,
            es_name = path["e0"].e_name,
            next_e_space = path["e0"].e_space_id,
            next_r_space = path["e0"].r_space_id,
            aciton_dist = path["e0"].aciton_dist
        for (let action in path) {
            if (action !== "e0") {
                if (path[action].r_name.substring(path[action].r_name.length - 4) !== "_inv") {
                    _path.push({
                        "path_id": parseInt(path_key.substring(4)),
                        "link_id": es_id + '-' + path[action].r_id + '-' + path[action].e_id,
                        "es_id": es_id,
                        "es_name": es_name,
                        "et_id": path[action].e_id,
                        "rel_id": path[action].r_id,
                        'r_name': path[action].r_name,
                        "et_name": path[action].e_name,
                        "next_e_space": next_e_space,
                        "next_r_space": next_r_space,
                        "aciton_dist": aciton_dist
                    })
                } else {
                    _path.push({
                        "path_id": parseInt(path_key.substring(4)),
                        "link_id": path[action].e_id + '-' + path[action].r_id + '-' + es_id,
                        "es_id": es_id,
                        "et_id": path[action].e_id,
                        "rel_id": path[action].r_id,
                        "es_name": es_name,
                        'r_name': path[action].r_name,
                        "et_name": path[action].e_name,
                        "next_e_space": next_e_space,
                        "next_r_space": next_r_space,
                        "aciton_dist": aciton_dist
                    })
                }
                es_id = path[action].e_id
                es_name = path[action].e_name
                next_e_space = path[action].e_space_id
                next_r_space = path[action].r_space_id
                aciton_dist = path[action].aciton_dist
            }
        }
        pathGroup.push(_path)
    }

    return pathGroup;
}

function initTestPathGroup(paths, links) {
    let pathGroup = [];
    links.forEach(link => {
        if (link.path_id === pathGroup.length) {
            pathGroup.push([])
        }
        if (link.name.substring(link.name.length - 4) !== "_inv") {
            pathGroup[link.path_id].push({
                "path_sorce": link.path_sorce,
                "path_id": link.path_id,
                "link_id": link.id,
                "es_eid": link.source,
                "et_id": link.target,
                "rel_id": link.rel_id,
                "es_name": link.es_name,
                'r_name': link.name,
                "et_name": link.et_name,
                "next_e_space": paths[link.source].e_space,
                "next_r_space": paths[link.source].r_space,
                "aciton_dist": paths[link.source].action_dist
            })
        } else {
            pathGroup[link.path_id].push({
                "path_sorce": link.path_sorce,
                "path_id": link.path_id,
                "link_id": link.id,
                "es_eid": link.target,
                "et_id": link.source,
                "rel_id": link.rel_id,
                "es_name": link.et_name,
                'r_name': link.name,
                "et_name": link.es_name,
                "next_e_space": paths[link.target].e_space,
                "next_r_space": paths[link.target].r_space,
                "aciton_dist": paths[link.target].action_dist
            })
        }
    })
    return pathGroup
}
export default SidePanel;
