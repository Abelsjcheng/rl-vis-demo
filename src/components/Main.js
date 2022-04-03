import React from 'react';
import * as d3 from 'd3'
import KgSettingPanel from './KgSettingPanel'
import CalendarChart from './CalendarChart';
import { forceManyBodyReuse } from 'd3-force-reuse'
import { Button, Row, Col, Timeline, Card, Select, Popconfirm, message } from 'antd';
import { DownCircleOutlined } from '@ant-design/icons';
import james_train_1 from "../case/lebron_james_train/train_path/james_train_0.json"
import james_train_2 from "../case/lebron_james_train/train_path/james_train_10.json"
import james_train_3 from "../case/lebron_james_train/train_path/james_train_20.json"
import james_train_4 from "../case/lebron_james_train/train_path/james_train_30.json"
import james_train_5 from "../case/lebron_james_train/train_path/james_train_40.json"
import james_train_6 from "../case/lebron_james_train/train_path/james_train_50.json"
import james_train_7 from "../case/lebron_james_train/train_path/james_train_60.json"
import james_train_8 from "../case/lebron_james_train/train_path/james_train_70.json"
import james_train_9 from "../case/lebron_james_train/train_path/james_train_80.json"
import james_train_10 from "../case/lebron_james_train/train_path/james_train_90.json"
import james_train_11 from "../case/lebron_james_train/train_path/james_train_100.json"
// import james_test_kg from "../case/lebron_james_test/lebron_james_test.json"
// import james_test from "../case/lebron_james_test/lebron_james_test_action_space.json"
import kobe_test_kg from "../case/kobe_bryant_test/kobe_bryant_subKg.json"
import kobe_test from "../case/kobe_bryant_test/kobe_bryant_test_action_space.json"

const { Option } = Select;
class Main extends React.Component {
    constructor(props) {
        super(props);
        const _kgData = JSON.parse(JSON.stringify(props.kgData));
        this.simulation = d3.forceSimulation();
        this.zoom = d3.zoom();
        this.svg = null;
        this.svg_kg = null;
        this.linkGroup = null;
        this.marker = null;
        this.markerPath = null;
        this.nodeGroup = null;
        this.nodeGradient = null;
        this.linkTextGroup = null;
        this.nodeTextGroup = null;
        this.updateLink = null;
        this.updateNode = null;
        this.updateLinkText = null;
        this.updateNodeText = null;
        this.svgWidth = null;
        this.svgHeight = null;
        this.kgNetwork = React.createRef();
        this.dataSet = initDataSet()
        this.pathGroup = initPathGroup(james_train_1);
        this.testStatus = true;
        this.pathOrder = 0
        this.state = {
            nodes: dataFilter(_kgData.nodes),
            links: dataFilter(_kgData.links),
            forceSet: {
                bodyStrength: -1000, // 节点排斥力，负数为模拟电荷力
                linkDistance: 200, // 边长度
                nodeSize: 15, // 节点大小
            },
            svgStyle: {
                linkWidth: 2, // 边长度
                linkStroke: '#D3D3D3', // 边颜色
                linkLabelSize: 20,
                nodeColor: '#DE9BF9',
                nodeLabelSize: 20
            },
            switchSet: {
                showNodeText: true, // 显示隐藏节点标签
                showLinkText: false, // 显示隐藏关系标签
                autoZoomFlag: true, // 自适应缩放
                nodeFocusFlag: true,
            },
            highLightNode: null, // 当前高亮节点
            highLightLink: null,  // 当前高亮边
            path: this.pathGroup[0]
        };
    }
    componentDidMount() {
        // dom加载后调用
        this.initSvg()
        this.initializeKg()
        this.initializeForces()

    }

    componentDidUpdate(prevProps, prevState) {
        // state更新后,执行
        const { forceSet, svgStyle, switchSet, links } = this.state
        if (forceSet !== prevState.forceSet || links !== prevState.links) {
            // 重载force
            this.updateForces()
            this.updateKg()

            if (forceSet.nodeSize !== prevState.forceSet.nodeSize) {
                this.updateKgDisplay()
            }
        }
        else if (
            svgStyle !== prevState.svgStyle ||
            switchSet.showNodeText !== prevState.switchSet.showNodeText ||
            switchSet.showLinkText !== prevState.switchSet.showLinkText
        ) {
            this.updateKgDisplay()
        }
    }
    componentWillReceiveProps(nextProps) {
        // 图谱更新
        const prevkgData = JSON.stringify(this.props.kgData),
            nextKgData = JSON.stringify(nextProps.kgData)
        if (prevkgData !== nextKgData) {

            const _kgData = JSON.parse(nextKgData),
                { switchSet } = this.state

            this.setState({
                nodes: _kgData.nodes,
                links: _kgData.links,
                switchSet: Object.assign({}, switchSet, { autoZoomFlag: true }),
            });
        }

        // // 返回 null 表示无需更新 state。
        // return null;
    }
    initSvg = () => {

        this.svgWidth = this.kgNetwork.current.offsetWidth
        this.svgHeight = this.kgNetwork.current.offsetHeight

        // 加载缩放
        this.zoom.scaleExtent([0.1, 4]).on('zoom', this.zoomed);

        this.svg = d3.select('.kg-network')
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .call(this.zoom)

        this.svg_kg = this.svg
            .append("g")
            .attr("class", "svg-kg-content");

    }

    initializeForces() {
        // 绑定力
        this.simulation
            .force("link", d3.forceLink())
            .force("charge", forceManyBodyReuse())
            .force("center", d3.forceCenter(this.svgWidth / 2, this.svgHeight / 2))
            .force("collide", d3.forceCollide())
            .force("forceX", d3.forceX(this.svgWidth / 2))
            .force("forceY", d3.forceY(this.svgHeight / 2));

        // 更新力布局
        this.updateForces();


    }
    updateForces = () => {
        const { nodes, links, forceSet } = this.state
        this.simulation.nodes(nodes)

        this.simulation.force("link")
            .id(function (d) { return d.id; })
            .distance(forceSet.linkDistance)
            .links(links)

        this.simulation.force("charge")
            .strength(forceSet.bodyStrength);

        this.simulation.force("collide")
            .strength(0.2)
            .radius(forceSet.nodeSize)
            .iterations(1);

        this.simulation.force("forceX")
            .strength(0.01);

        this.simulation.force("forceY")
            .strength(0.03);


        this.simulation.alpha(1).restart();
        this.updateDragTick();
    }

    initializeKg() {

        this.linkGroup = this.svg_kg.append("g")
            .attr("class", "link-group")

        this.marker = this.linkGroup.append("marker")
        this.markerPath = this.marker.append("path")

        let textGroup = this.svg_kg.append("g")
            .attr("class", "text-group")

        this.linkTextGroup = textGroup.append("g").attr("class", "linkText-group")

        this.nodeTextGroup = textGroup.append("g").attr("class", "nodeText-group")

        this.nodeGroup = this.svg_kg.append("g")
            .attr("class", "node-group")

        this.updateKg()

    }
    updateKg = (source) => {
        const { links, nodes, svgStyle, forceSet, switchSet } = this.state
        const { sourceNode } = this.props


        // 加载link数据
        let link = this.linkGroup.selectAll("path.link")
            .data(links, d => d.id)
        setDoubleLink(links)
        // 移出旧数据
        link.exit().remove();

        // 创建边
        let linkEnter = link.enter()
            .append("path")
            .attr("id", d => "link" + d.id)
            .attr("class", "link")
            .style("stroke", svgStyle.linkStroke)
            .style("stroke-width", svgStyle.linkWidth)
            .style('fill', 'rgba(0, 0, 0, 0)')
            .attr("marker-end", "url(#resolved)")

        // 合并数据用于全局更新样式和tick
        this.updateLink = linkEnter.merge(link);

        // 绘制箭头
        this.marker
            .attr("id", "resolved")
            .attr("markerUnits", "userSpaceOnUse")
            .attr("viewBox", "0 -" + forceSet.nodeSize * 0.4 + " " + forceSet.nodeSize * 0.8 + " " + forceSet.nodeSize * 0.8)
            .attr("refX", forceSet.nodeSize * 1.8)
            .attr("refY", 0)
            .attr("markerWidth", forceSet.nodeSize * 0.8)
            .attr("markerHeight", forceSet.nodeSize * 0.8)
            .attr("orient", "auto")
            .attr("stroke-width", 2)

        // 绘制箭头路径
        this.markerPath
            .attr("d", "M0,-" + forceSet.nodeSize * 0.4 + "L" + forceSet.nodeSize * 0.8 + ",0L0," + forceSet.nodeSize * 0.4)
            .attr('fill', svgStyle.linkStroke)

        // 加载node数据
        let node = this.nodeGroup.selectAll("circle.node").data(nodes, d => d.id);
        // 移出node旧数据

        node.exit().remove()
        // 添加node新数据
        let nodeEnter = node.enter()
            .append("circle")
            .attr("id", d => "node" + d.id)
            .attr("class", "node")
            .attr("r", forceSet.nodeSize)
            .style("fill", d => {
                if (d.name === sourceNode.name) {
                    return "red"
                } else if (d.name === "concept_sportsleague_nba") {
                    return "blue"
                } else {
                    return "#DE9BF9"
                }
            })
            .call(this.drag(this.simulation))

        // 合并节点数据用于全局更新相似和tick
        this.updateNode = nodeEnter.merge(node)

        // 加载nodeText数据
        let nodeText = this.nodeTextGroup.selectAll("text.node-text").data(nodes, d => d.id);
        // 移出nodeText旧数据
        nodeText.exit().remove();
        // 绘制节点标签
        let nodeTextEnter = nodeText.enter()
            .append("text")
            .attr("class", "node-text")
            .attr("dy", forceSet.nodeSize + 20)
            .style("visibility", switchSet.showNodeText ? 'visible' : 'hidden')
            .style('fill', "black")
            .attr("font-size", svgStyle.nodeLabelSize)
            .text(d => splitNodeName(d.name))
            .attr("dx", 0)
            .attr("text-anchor", "middle")
            .on('mouseover', function (e, d) {
                d3.select(this)
                    .text(() => d.name)
            })
            .on('mouseout', function (e, d) {
                d3.select(this)
                    .text(splitNodeName(d.name))
            })

        // 合并节点数据用于全局修改节点标签样式和tick
        this.updateNodeText = nodeTextEnter.merge(nodeText)

        // 加载linkText数据
        let linkText = this.linkTextGroup.selectAll("text.link-text").data(links, d => d.id);
        // 移出linkText旧数据
        linkText.exit().remove();
        // 绘制link标签
        let linkTextEnter = linkText.enter()
            .append("text")

        linkTextEnter
            .attr("class", "link-text")
            .attr("dy", -3 - svgStyle.linkWidth)
            .attr("font-size", svgStyle.linkLabelSize)
            .style("visibility", switchSet.showLinkText ? 'visible' : 'hidden')
            .style('fill', "#CFCFCF")
            .append("textPath")
            .attr("xlink:href", d => "#link" + d.id)
            .attr("startOffset", "50%")
            .attr("text-anchor", 'middle')
            .text(d => splitLinkName(d.name))

        // 合并边数据用于全局修改边标签样式和tick
        this.updateLinkText = linkTextEnter.merge(linkText)


    }
    updateKgDisplay = () => {
        const { svgStyle, forceSet, switchSet } = this.state

        // 更新边样式
        this.updateLink
            .style("stroke", svgStyle.linkStroke)
            .style("stroke-width", svgStyle.linkWidth)

        // 更新箭头样式
        this.marker
            .attr("viewBox", "0 -" + forceSet.nodeSize * 0.4 + " " + forceSet.nodeSize * 0.8 + " " + forceSet.nodeSize * 0.8)
            .attr("refX", forceSet.nodeSize * 1.8)
            .attr("markerWidth", forceSet.nodeSize * 0.8)
            .attr("markerHeight", forceSet.nodeSize * 0.8)

        // 更新箭头路径样式
        this.markerPath
            .attr("d", "M0,-" + forceSet.nodeSize * 0.4 + "L" + forceSet.nodeSize * 0.8 + ",0L0," + forceSet.nodeSize * 0.4)
            .attr('fill', svgStyle.linkStroke)

        this.updateLinkText
            .attr("dy", -3 - svgStyle.linkWidth)
            .attr("font-size", svgStyle.linkLabelSize)
            .style("visibility", switchSet.showLinkText ? 'visible' : 'hidden')

        this.updateNodeText
            .style("visibility", switchSet.showNodeText ? 'visible' : 'hidden')
            .attr("font-size", svgStyle.nodeLabelSize)


    }
    updateDragTick() {
        const { forceSet } = this.state
        this.simulation.on('tick', () => {

            // 边显示位置
            this.updateLink
                .attr('d', d => {
                    if (d.rel_id === 2) {
                        const x1 = d.source.x - Math.sin(2 * Math.PI / 360 * 60) * forceSet.nodeSize,
                            x2 = d.source.x + Math.sin(2 * Math.PI / 360 * 60) * forceSet.nodeSize,
                            y = d.source.y - Math.cos(2 * Math.PI / 360 * 60) * forceSet.nodeSize
                        return 'M ' + x1 + ',' + y + ' C' + (x1 - 30) + ',' + (y - forceSet.nodeSize * 4) + ' ' + (x2 + 30) + ',' + (y - forceSet.nodeSize * 4) + ' ' + x2 + ',' + y
                    } else {
                        //return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y
                        return 'M ' + d.source.x + ' ' + d.source.y + ' Q ' + (d.source.x + d.target.x) / 2 + ' ' + ((d.source.y + d.target.y) / 2 + d.linknum * 50) + ' ' + d.target.x + ' ' + d.target.y
                    }
                })
            // 节点显示位置
            this.updateNode
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
            // 节点标签显示位置
            this.updateNodeText
                .attr('x', (d) => d.x)
                .attr('y', (d) => d.y);

            // // 边显示位置
            // this.updateLinkText
            //     .attr('transform', (d) => {
            //         if (d.target.x <= d.source.x) {
            //             return 'rotate(180 ' + (d.source.x + d.target.x) / 2 + ' ' + (d.source.y + d.target.y) / 2 + ')';
            //         }
            //         else {
            //             return 'rotate(0)';
            //         }
            //     })

            if (this.simulation.alpha() < this.simulation.alphaMin()) {
                // 拖拽时不缩放
                if (this.state.switchSet.autoZoomFlag)
                    this.autoZoom() // 自适应缩放

            }
        });
        this.firstUpdate(this.simulation)

    }
    autoZoom() {
        const viewBox = this.svg.node().getBBox(),
            transform = d3.zoomTransform(this.svg.node()),
            pre_scale = transform.k;

        if (viewBox.width > this.svgWidth || viewBox.height > this.svgHeight) {
            const next_scale = Math.min((this.svgWidth - 100) / viewBox.width, (this.svgHeight - 100) / viewBox.height),
                center_x = this.svgWidth / 2 - (viewBox.x + viewBox.width / 2 - transform.x) / pre_scale * next_scale,
                center_y = this.svgHeight / 2 - (viewBox.y + viewBox.height / 2 - transform.y) / pre_scale * next_scale;

            const t = d3.zoomIdentity.translate(center_x, center_y).scale(next_scale);
            this.svg.transition().duration(750).call(this.zoom.transform, t)
        }
    }
    //第一轮迭代，大概120次
    firstUpdate(simulation) {
        while (simulation.alpha() > simulation.alphaMin()) {
            simulation.tick();
        }
    }
    zoomed = (event) => {
        this.svg_kg.attr('transform', event.transform);
    }
    // 拖拽
    drag(simulation) {
        let _this = this

        function dragstarted(event, d) {
            _this.setState({ switchSet: Object.assign({}, _this.state.switchSet, { autoZoomFlag: false }) })
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; // fx固定节点
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = d.x;
            d.fy = d.y;
        }

        return d3
            .drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }
    pathStart = () => {
        this.testStatus = 'start'
        this.pathOrder = 0
        this.clearSvg()
        this.inferenceAnimation()
    }
    pathStop = () => {
        this.testStatus = 'stop'
    }
    pathContinue = () => {
        this.testStatus = 'continue'
        this.clearSvg()
        this.inferenceAnimation()
    }
    inferenceAnimation() {
        const { svgStyle } = this.state
        let pathLingth = this.pathGroup.length
        const visPath = async (path) => {
            this.setState({ path: path })
            await forward(path[0])
            await forward(path[1])
            await forward(path[2])
            if (path[2].et_name === "concept_sportsleague_nba") {
                this.testStatus = 'stop'
                message.success('到达目标节点');
            }
            if (++this.pathOrder < pathLingth) {
                if (this.testStatus === 'stop') {
                    return;
                } else {
                    this.clearSvg()
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    visPath(this.pathGroup[this.pathOrder])
                }
            } else {
                this.pathOrder = 0
                return;
            }
        }
        function forward(action) {
            d3.select('#link' + action.link_id)
                .style("stroke", "yellow")
                .style("stroke-width", svgStyle.linkWidth * 3)
            d3.select('#node' + action.et_id)
                .style("fill", "green")
            return new Promise(resolve => setTimeout(resolve, 1000))
        }
        visPath(this.pathGroup[this.pathOrder])
    }
    clearSvg() {
        const { svgStyle } = this.state
        const { sourceNode } = this.props
        this.updateLink
            .style("stroke", svgStyle.linkStroke)
            .style("stroke-width", svgStyle.linkWidth)

        this.updateNode
            .style("fill", d => {
                if (d.name === sourceNode.name) {
                    return "red"
                } else if (d.name === "concept_sportsleague_nba") {
                    return "blue"
                } else {
                    return "#DE9BF9"
                }
            })
    }
    handleSelectDataSetChange = (value) => {
        if (this.dataSet[value].dataName !== "测试集") {
            this.pathGroup = initPathGroup(this.dataSet[value].data);
            this.setState({ path: this.pathGroup[0] })
            if (JSON.stringify(kobe_test_kg) !== this.props.kgData) {
                const _kgData = JSON.parse(JSON.stringify(this.props.kgData));
                this.setState({
                    nodes: dataFilter(_kgData.nodes),
                    links: dataFilter(_kgData.links),
                    switchSet: Object.assign({}, this.state.switchSet, { autoZoomFlag: true })
                })
            }
        } else {
            const _kgData = JSON.parse(JSON.stringify(kobe_test_kg));
            this.pathGroup = initTestPathGroup(this.dataSet[value].data, _kgData.links);
            this.setState({
                path: this.pathGroup[0],
                nodes: dataFilter(_kgData.nodes),
                links: dataFilter(_kgData.links),
                switchSet: Object.assign({}, this.state.switchSet, { autoZoomFlag: true })
            })
        }


    }
    handleSelectPathChange = (value) => {
        this.setState({ path: this.pathGroup[value] })
    }
    handleKgSettingChange = (set, setType) => {
        // 控制面板回参
        switch (setType) {
            case 'forceSet':
                const forceSet = { ...this.state.forceSet }
                this.setState({ forceSet: Object.assign({}, forceSet, { [set.forceSetType]: set.value }) })
                break;
            case 'svgStyle':
                const svgStyle = { ...this.state.svgStyle }
                this.setState({ svgStyle: Object.assign({}, svgStyle, { [set.svgStyleType]: set.value }) })
                break;
            case 'switchSet':
                const switchSet = { ...this.state.switchSet }

                this.setState({ switchSet: Object.assign({}, switchSet, { [set.switchSetType]: set.value }) })
                if (set.switchSetType === "autoZoomFlag" && set.value) {
                    this.autoZoom()
                }
                break;
            case 'nodeMore':
                // 节点扩展和收缩
                this.setState({ nodes: set.nodes, links: set.links })
                break;
            default:
                break;
        }
    }

    render() {
        const { forceSet, svgStyle, switchSet, path, nodes, links } = this.state;
        return (
            <div className="rl-view">
                <div className="rl-view-sider">
                    <Row justify="space-around">
                        <Col span={24} className="rl-view-sider-title">案例：实体训练(预测)</Col>
                        <Col span={24}>
                            给定源实体和查询关系:
                        </Col>
                        <Col span={24}>
                            (coach_lebron_james, athleteplayssport, ?)
                        </Col>
                        <Col span={24}>
                            训练的目标实体: sport_basketball
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
                                            this.dataSet.map((data, index) => {
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
                                                            path[2].et_name === "concept_sportsleague_nba" ? "路径" + path[0].path_id + "(正确)" : "路径" + path[0].path_id
                                                        }
                                                    </Option>
                                                )
                                            })
                                        }
                                    </Select>
                                </>
                            }
                                extra={!path[2].path_sorce ? path[2].et_name === "concept_sportsleague_nba" ? "奖励:1" : "奖励:0" : "评分:" + path[2].path_sorce}
                                bodyStyle={{ padding: "12px" }}
                            >
                                <Row justify="space-around" style={{ marginBottom: "20px" }}>
                                    <Col span={4}>关系</Col>
                                    <Col span={4}>实体</Col>
                                </Row>
                                <Timeline mode="alternate">
                                    <Popconfirm
                                        placement="rightTop"
                                        icon={false}
                                        title={<CalendarChart chartId={0} step={path[0]} nodes={nodes} links={links} />}
                                        showCancel={false}
                                    >
                                        <Timeline.Item className="timeline-item" >{splitNodeName(path[0].es_name)}</Timeline.Item>
                                    </Popconfirm>
                                    <Timeline.Item dot={<DownCircleOutlined style={{ fontSize: '16px' }} />} >{splitLinkName(path[0].r_name)}</Timeline.Item>
                                    <Popconfirm
                                        placement="rightTop"
                                        icon={false}
                                        title={<CalendarChart chartId={1} step={path[1]} nodes={nodes} links={links} />}
                                        showCancel={false}
                                    >
                                        <Timeline.Item className="timeline-item" >{splitNodeName(path[0].et_name)}</Timeline.Item>
                                    </Popconfirm>
                                    <Timeline.Item dot={<DownCircleOutlined style={{ fontSize: '16px' }} />} >{splitLinkName(path[1].r_name)}</Timeline.Item>
                                    <Popconfirm
                                        placement="rightTop"
                                        icon={false}
                                        title={<CalendarChart chartId={2} step={path[2]} nodes={nodes} links={links} />}
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

                </div>
                <div className="rl-view-content">
                    <div ref={this.kgNetwork} className="kg-network" onContextMenu={(e) => e.preventDefault()}>
                        <KgSettingPanel
                            onKgSettingChange={this.handleKgSettingChange}
                            forceSet={forceSet}
                            svgStyle={svgStyle}
                            switchSet={switchSet}
                        />
                    </div>
                </div>
            </div>
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
function dataFilter(data) {
    let map = new Map()
    return data.filter(item => {
        if (!map.has(item.id)) {
            map.set(item.id, item)
            return true
        } else {
            return false
        }
    })
}

function splitLinkName(name) {
    let arr = name.split(':')
    return arr.length !== 1 ? arr.slice(1).join('') : name
}
function splitNodeName(name) {
    let arr = name.split('_')
    return arr.length !== 1 ? arr.slice(1).join('_') : name
}
function initDataSet() {
    const dataSet = [
        { "dataName": "训练1", data: james_train_1 },
        { "dataName": "训练2", data: james_train_2 },
        { "dataName": "训练3", data: james_train_3 },
        { "dataName": "训练4", data: james_train_4 },
        { "dataName": "训练5", data: james_train_5 },
        { "dataName": "训练6", data: james_train_6 },
        { "dataName": "训练7", data: james_train_7 },
        { "dataName": "训练8", data: james_train_8 },
        { "dataName": "训练9", data: james_train_9 },
        { "dataName": "训练10", data: james_train_10 },
        { "dataName": "训练11", data: james_train_11 },
        { "dataName": "测试集", data: kobe_test },
    ]
    return dataSet
}
function setDoubleLink(links) {

    const linkGroup = {};
    // 两点之间的线根据两点的 name 属性设置为同一个 key，加入到 linkGroup 中，给两点之间的所有边分成一个组
    links.forEach((link) => {
        const key = setLinkName(link);

        if (!linkGroup.hasOwnProperty(key)) {
            linkGroup[key] = [];

        }
        linkGroup[key].push(link);
    });
    // 遍历给每组去调用 setLinkNumbers 来分配 linkum
    links.forEach((link) => {
        const key = setLinkName(link);
        link.size = linkGroup[key].length;
        const group = linkGroup[key];
        // const keyPair = key.split(':');
        // let type = 'noself';
        // if (keyPair[0] === keyPair[1]) {
        //     type = 'self';
        // }
        // link.type = type
        setLinkNumbers(group);
    });
}
function setLinkNumbers(group) {
    const len = group.length;
    const linksA = [];
    const linksB = [];

    for (let i = 0; i < len; i++) {
        const link = group[i];
        if (typeof (link.source) === "object" ? link.source.id < link.target.id : link.source < link.target) {
            linksA.push(link);
        } else {
            linksB.push(link);
        }
        
    }
    let startLinkANumber = 1;
    for (let i = 0; i< linksA.length ;i++){
        const link = linksA[i];
        if(linksB.length === 0){
            if (linksA.length > 1) {
                link.linknum = i % 2 === 0 && i > 0 ? ++startLinkANumber * Math.pow(-1, i) : startLinkANumber * Math.pow(-1, i)
            } else {
                link.linknum = 0
            }
        }else {
            link.linknum = startLinkANumber++;
        }
    }
    let startLinkBNumber = -1;
    for (let i = 0; i< linksB.length ;i++){
        const link = linksB[i];
        if(linksA.length === 0){
            if (linksB.length > 1) {
                link.linknum = i % 2 === 0 && i > 0 ? ++startLinkBNumber * Math.pow(-1, i) : startLinkBNumber * Math.pow(-1, i)
            } else {
                link.linknum = 0
            }
        }else {
            link.linknum = startLinkBNumber--;
        }
    }
}
function setLinkName(link) {
    return typeof (link.source) === "object" ?
        link.source.id < link.target.id
            ? link.source.id + ':' + link.target.id
            : link.target.id + ':' + link.source.id :
        link.source < link.target
            ? link.source + ':' + link.target
            : link.target + ':' + link.source
}
export default Main;