import React from 'react';
import * as d3 from 'd3'
import KgSettingPanel from './KgSettingPanel'
import { forceManyBodyReuse } from 'd3-force-reuse'
import { splitLinkName, splitNodeName } from '../util/tool'

class Kg extends React.Component {
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
        this.updateLink = null;
        this.updateNode = null;
        this.updateLinkText = null;
        this.svgWidth = null;
        this.svgHeight = null;
        this.kgNetwork = React.createRef();
        this.state = {
            nodes: dataFilter(_kgData.nodes),
            links: dataFilter(_kgData.links),
            forceSet: {
                bodyStrength: -1000, // 节点排斥力，负数为模拟电荷力
                linkDistance: 280, // 边长度
                nodeSize: 10, // 节点大小
            },
            svgStyle: {
                linkWidth: 1,
                linkStroke: '#D3D3D3', // 边颜色
                linkLabelSize: 13,
                nodeColor: '#DE9BF9',
                nodeLabelSize: 14
            },
            switchSet: {
                showNodeText: true, // 显示隐藏节点标签
                showLinkText: true, // 显示隐藏关系标签
                autoZoomFlag: true, // 自适应缩放
                nodeFocusFlag: true,
            },
            highLightNode: null, // 当前高亮节点
            highLightLink: null,  // 当前高亮边
        };
    }
    componentDidMount() {
        // dom加载后调用
        if (this.props.onRef)
            this.props.onRef(this);
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
    UNSAFE_componentWillReceiveProps(nextProps) {
        // 图谱更新
        const prevkgData = JSON.stringify(this.props.kgData),
            nextKgData = JSON.stringify(nextProps.kgData)
        if (prevkgData !== nextKgData) {
            const _kgData = JSON.parse(nextKgData),
                { switchSet } = this.state

            this.setState({
                nodes: dataFilter(_kgData.nodes),
                links: dataFilter(_kgData.links),
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
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight)
            .call(this.zoom)
            .on("click", this.handleSvgClick)

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
            .links(links)
            .distance(forceSet.linkDistance)


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

        this.marker = this.linkGroup.selectAll("marker.marker")
            .data(["noself", "self"], d => d)
            .enter()
            .append("marker")

        this.markerPath = this.marker.append("path")

        let textGroup = this.svg_kg.append("g")
            .attr("class", "text-group")

        this.linkTextGroup = textGroup.append("g").attr("class", "linkText-group")

        this.nodeGroup = this.svg_kg.append("g")
            .attr("class", "node-group")

        this.updateKg()

    }
    updateKg = (source) => {
        const { links, nodes, svgStyle, forceSet, switchSet } = this.state
        const { caseTriple } = this.props

        let link = this.linkGroup.selectAll("path.link")
            .data(links, d => d.id)

        setDoubleLink(links)

        link.exit().remove();

        let linkEnter = link.enter()
            .append("path")
            .attr("id", d => `link${d.id}`)
            .attr("class", "link")
            .on('mouseover', d => {
                d3.select(`#linkText${d.id}`)
                    .style("visibility", 'visible')
            })

        this.updateLink = linkEnter.merge(link)
            .style("stroke", svgStyle.linkStroke)
            .style("stroke-width", svgStyle.linkWidth)
            .style('fill', 'rgba(0, 0, 0, 0)')
            .attr("marker-end", d => d.type === "self" ? "url(#self)" : "url(#noself)");

        this.marker
            .attr("id", d => d)
            .attr("markerUnits", "userSpaceOnUse")
            .attr("viewBox", `0 ${-forceSet.nodeSize * 0.3} ${forceSet.nodeSize * 0.6} ${forceSet.nodeSize * 0.6}`)
            .attr("refX", d => d === "self" ? forceSet.nodeSize * 0.6 : forceSet.nodeSize * 1.6)
            .attr("refY", 0)
            .attr("markerWidth", forceSet.nodeSize * 0.6)
            .attr("markerHeight", forceSet.nodeSize * 0.6)
            .attr("orient", "auto")
            .attr("stroke-width", svgStyle.linkWidth)

        this.markerPath
            .attr("d", `M0,${-forceSet.nodeSize * 0.3} L${forceSet.nodeSize * 0.6},0 L0,${forceSet.nodeSize * 0.3}`)
            .attr('fill', svgStyle.linkStroke)

        let node = this.nodeGroup.selectAll("g").data(nodes, d => d.id);

        node.exit().remove()

        let nodeEnter = node.enter()
            .append('g')
            .attr("id", d => `node${d.id}`)
            .call(this.drag(this.simulation))


        nodeEnter.append("circle")
            .attr("class", "node")
            .attr("r", forceSet.nodeSize)

        nodeEnter.append("text")
            .attr("class", "node-text")
            .attr("dy", forceSet.nodeSize * 2)
            .style("visibility", switchSet.showNodeText ? 'visible' : 'hidden')
            .style('fill', "black")
            .attr("font-size", svgStyle.nodeLabelSize)
            .attr("dx", 0)
            .attr("text-anchor", "middle")
            .text(d => splitNodeName(d.name))
            .on('mouseover', function (e, d) {
                d3.select(this)
                    .text(d.name)
            })
            .on('mouseout', function (e, d) {
                d3.select(this)
                    .text(splitNodeName(d.name))
            })

        this.updateNode = nodeEnter.merge(node)

        this.updateNode.select('.node')
            .style("fill", d => {
                if (d.name === caseTriple.sourceEntity) {
                    return "red"
                } else if (d.name === caseTriple.targetEntity) {
                    return "blue"
                } else {
                    return "#DE9BF9"
                }
            })

        let linkText = this.linkTextGroup.selectAll("text.link-text").data(links, d => d.id);

        linkText.exit().remove();

        let linkTextEnter = linkText.enter()
            .append("text")

        linkTextEnter
            .attr("class", "link-text")
            .attr("id", d => `linkText${d.id}`)
            .attr("font-size", svgStyle.linkLabelSize)
            .style("visibility", switchSet.showLinkText ? 'visible' : 'hidden')
            .style('fill', "#CFCFCF")
            .attr("text-anchor", "middle")
            .text(d => splitLinkName(d.name))

        this.updateLinkText = linkTextEnter.merge(linkText)
            .attr("dy", d => d.linknum ? 3 + d.linknum * 20 : -3 + d.linknum * 20)


    }
    updateKgDisplay = () => {
        const { svgStyle, forceSet, switchSet } = this.state

        this.updateLink
            .style("stroke", svgStyle.linkStroke)
            .style("stroke-width", svgStyle.linkWidth)

        this.marker
            .attr("viewBox", `0 ${-forceSet.nodeSize * 0.3} ${forceSet.nodeSize * 0.6} ${forceSet.nodeSize * 0.6}`)
            .attr("refX", d => d === "self" ? forceSet.nodeSize * 0.6 : forceSet.nodeSize * 1.6)
            .attr("markerWidth", forceSet.nodeSize * 0.6)
            .attr("markerHeight", forceSet.nodeSize * 0.6)

        this.markerPath
            .attr("d", `M0,${-forceSet.nodeSize * 0.3} L${forceSet.nodeSize * 0.6},0 L0,${forceSet.nodeSize * 0.3}`)
            .attr('fill', svgStyle.linkStroke)

        this.updateNode
            .select('.node')
            .attr("r", forceSet.nodeSize)

        this.updateNode
            .select('.node-text')
            .style("visibility", switchSet.showNodeText ? 'visible' : 'hidden')
            .attr("font-size", svgStyle.nodeLabelSize)

        this.updateLinkText
            .attr("dy", -3 - svgStyle.linkWidth)
            .attr("font-size", svgStyle.linkLabelSize)
            .style("visibility", switchSet.showLinkText ? 'visible' : 'hidden')

    }
    updateDragTick() {
        const { forceSet } = this.state;
        this.simulation.on('tick', () => {
            this.updateLink
                .attr('d', d => {
                    if (d.type === "self") {
                        /*
                            x1 圆左上角的点x轴值
                            x2 圆右上角的点x轴值
                            y  圆左上角的y轴值
                        */
                        const x1 = d.source.x - Math.sin(2 * Math.PI / 360 * 60) * forceSet.nodeSize,
                            x2 = d.source.x + Math.sin(2 * Math.PI / 360 * 60) * forceSet.nodeSize,
                            y = d.source.y - Math.cos(2 * Math.PI / 360 * 60) * forceSet.nodeSize;
                        return `M${x1.toFixed(2)},${y.toFixed(2)} C${(x1 - 20).toFixed(2)},${(y - forceSet.nodeSize * 5).toFixed(2)} ${(x2 + 20).toFixed(2)},${(y - forceSet.nodeSize * 5).toFixed(2)} ${x2.toFixed(2)},${y.toFixed(2)}`
                    } else {
                        /*  4个象限取值:
                            cos为负sin+  ++
                            ++           cos为负sin+
                        */
                        let bevelEdge = Math.sqrt(Math.pow(d.target.x - d.source.x, 2) + Math.pow(d.target.y - d.source.y, 2)),
                            rotateAngleCos = (d.target.x - d.source.x) / bevelEdge,
                            rotateAngleSin = (d.source.y - d.target.y) / bevelEdge;

                        if (d.target.y < d.source.y && d.target.x > d.source.x) {
                            rotateAngleCos = -rotateAngleCos
                            rotateAngleSin = -rotateAngleSin
                        } else if (d.target.y < d.source.y && d.target.x < d.source.x) {
                            rotateAngleCos = -rotateAngleCos
                            rotateAngleSin = -rotateAngleSin
                        }
                        const leftBendDistance = ((d.source.x + d.target.x) / 2 + rotateAngleSin * d.linknum * 20).toFixed(2),
                            rightBendDistance = ((d.source.y + d.target.y) / 2 + rotateAngleCos * d.linknum * 20).toFixed(2)

                        return `M${d.source.x.toFixed(2)},${d.source.y.toFixed(2)} Q${leftBendDistance},${rightBendDistance} ${d.target.x.toFixed(2)},${d.target.y.toFixed(2)}`
                    }
                })
            // 节点显示位置
            this.updateNode
                .attr('transform', (d) => {
                    return `translate(${d.x.toFixed(2)},${d.y.toFixed(2)})`
                });

            this.updateLinkText
                .attr('transform', (d) => {
                    if (d.type === "self") {
                        return `translate(${((d.source.x + d.target.x) / 2).toFixed(2)},${((d.source.y + d.target.y) / 2 - forceSet.nodeSize * 5).toFixed(2)})`
                    } else {
                        let radian = Math.atan((d.target.y - d.source.y) / (d.target.x - d.source.x)),
                            angle = Math.floor(180 / (Math.PI / radian));
                        return `translate(${((d.source.x + d.target.x) / 2).toFixed(2)},${((d.source.y + d.target.y) / 2).toFixed(2)}) rotate(${angle.toFixed(2)})`

                    }
                });

            if (this.simulation.alpha() < this.simulation.alphaMin()) {
                // 拖拽时不缩放
                if (this.state.switchSet.autoZoomFlag) {
                    this.autoZoom() // 自适应缩放
                }
            }
        });
        this.firstUpdate(this.simulation)

    }
    autoZoom() {
        const viewBox = this.svg.node().getBBox(),
            transform = d3.zoomTransform(this.svg.node()),
            pre_scale = transform.k;

        if (viewBox.width > this.svgWidth || viewBox.height > this.svgHeight) {
            const next_scale = Math.min((this.svgWidth - 50) / viewBox.width, (this.svgHeight - 50) / viewBox.height),
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
        this.svg_kg.attr(
            "transform",
            `translate(${event.transform.x.toFixed(4)},${event.transform.y.toFixed(4)}) 
            scale(${event.transform.k.toFixed(4)})`
        );
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
    handleSvgClick = (e) => {
        if (e.target.nodeName === "svg") {
            this.clearSvg()
        }
    }
    clearSvg() {
        const { svgStyle } = this.state
        const { caseTriple } = this.props
        this.updateLink
            .style("stroke", svgStyle.linkStroke)
            .style("stroke-width", svgStyle.linkWidth)

        this.updateNode
            .select('.node')
            .style("fill", d => {
                if (d.name === caseTriple.sourceEntity) {
                    return "red"
                } else if (d.name === caseTriple.targetEntity) {
                    return "blue"
                } else {
                    return "#DE9BF9"
                }
            })
    }
    pathForward(action, wait) {
        const { svgStyle } = this.state

        return new Promise(resolve => {
            d3.select(`#link${action.link_id}`)
                .style("stroke", "yellow")
                .style("stroke-width", svgStyle.linkWidth * 3)
            d3.select(`#node${action.et_id}`)
                .select('.node')
                .style("fill", "green")
            setTimeout(resolve, wait)
        })
    }
    handleHightLightPath(path) {
        const { svgStyle } = this.state
        this.clearSvg()
        path.forEach(action => {
            d3.select(`#link${action.link_id}`)
                .style("stroke", "yellow")
                .style("stroke-width", svgStyle.linkWidth * 3)
            d3.select(`#node${action.et_id}`)
                .select('.node')
                .style("fill", "green")
        })
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
            default:
                break;
        }
    }

    render() {
        const { forceSet, svgStyle, switchSet } = this.state;
        return (
            <div ref={this.kgNetwork} className="kg-network" onContextMenu={(e) => e.preventDefault()}>
                <KgSettingPanel
                    onKgSettingChange={this.handleKgSettingChange}
                    forceSet={forceSet}
                    svgStyle={svgStyle}
                    switchSet={switchSet}
                />
            </div>
        );
    }
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

function setDoubleLink(links) {

    const linkGroup = {};
    // 根据link的source和target的id属性，对所有边进行分组
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
        const group = linkGroup[key];
        const keyPair = key.split(':');
        // 设置自循环标签
        let type = 'noself';
        if (keyPair[0] === keyPair[1]) {
            type = 'self';
        }
        link.type = type
        setLinkNumbers(group);
    });
}
function setLinkNumbers(group) {
    const len = group.length;
    const linksA = []; // 正向link
    const linksB = []; // 反向link

    for (let i = 0; i < len; i++) {
        const link = group[i];
        if (typeof (link.source) === "object" ? link.source.id < link.target.id : link.source < link.target) {
            linksA.push(link);
        } else {
            linksB.push(link);
        }

    }
    // 正向组
    let startLinkANumber = 0;
    for (let i = 0; i < linksA.length; i++) {
        const link = linksA[i];
        if (linksB.length === 0) {
            if (linksA.length > 1) {
                // 1 -1 2 -2 3 -3
                link.linknum = i % 2 === 0 ? (++startLinkANumber) * Math.pow(-1, i) : startLinkANumber * Math.pow(-1, i)
            } else {
                link.linknum = 0
            }
        } else {
            link.linknum = ++startLinkANumber;
        }

    }
    let startLinkBNumber = 0;
    for (let i = 0; i < linksB.length; i++) {
        const link = linksB[i];
        if (linksA.length === 0) {
            if (linksB.length > 1) {
                link.linknum = i % 2 === 0 ? (++startLinkBNumber) * Math.pow(-1, i) : startLinkBNumber * Math.pow(-1, i)
            } else {
                link.linknum = 0
            }
        } else {
            link.linknum = --startLinkBNumber;
        }
    }
}
function setLinkName(link) {
    return typeof (link.source) === "object" ?
        link.source.id < link.target.id
            ? `${link.source.id}:${link.target.id}`
            : `${link.target.id}:${link.source.id}` :
        link.source < link.target
            ? `${link.source}:${link.target}`
            : `${link.target}:${link.source}`
}
export default Kg;