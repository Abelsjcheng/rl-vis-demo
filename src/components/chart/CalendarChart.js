import React from 'react';
import * as echarts from 'echarts';

class CalendarChart extends React.Component {
    constructor(props) {
        super(props);
        this.nodes = rebuild(props.nodes, 'node')
        this.links = rebuild(props.links, 'link')
        this.next_entity = getNextEntity(props.step.next_e_space)
        this.next_relation = getNextRelation(props.step.next_r_space)
        this.action_prob = getActionProb(props.step, this.next_entity, this.next_relation)
        this.step = props.step
        this.state = {

        }
    }
    componentDidMount() {
        this.initCalendarChart()
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.step.path_id !== nextProps.step.path_id) {
            this.next_entity = getNextEntity(nextProps.step.next_e_space)
            this.next_relation = getNextRelation(nextProps.step.next_r_space)
            this.action_prob = getActionProb(nextProps.step, this.next_entity, this.next_relation)
            this.step = nextProps.step
            this.initCalendarChart()
        }

    }
    initCalendarChart() {
        const { chartId } = this.props
        const _this = this
        let chart = echarts.init(document.getElementById('chart' + chartId));
        chart.setOption({
            title: {
                text: "动作空间及动作选择概率",
                x: "center",
            },
            tooltip: {
                position: 'top',
                formatter: function (info) {
                    let res = `下一跳的关系:${_this.links.get(_this.next_relation[info.data[1]])}<br/>下一跳的实体:${_this.nodes.get(_this.next_entity[info.data[0]])}<br/>动作选择概率:${info.data[2]}`
                    return res;
                },
            },
            visualMap: {
                min: 0,
                max: 1,
                type: 'piecewise',
                orient: 'horizontal',
                left: 'center',
                top: 30
            },
            grid: {
                height: '50%',
                top: '30%'
            },
            xAxis: {
                type: 'category',
                name: "实体id",
                data: this.next_entity,
                splitArea: {
                    show: true
                }
            },
            yAxis: {
                type: 'category',
                name: "关系id",
                data: this.next_relation,
                splitArea: {
                    show: true
                }
            },

            series: [
                {
                    type: 'heatmap',
                    data: this.action_prob,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        });

        chart.dispatchAction({
            type: 'highlight',
            seriesIndex: 0,
            dataIndex: highLightCurAciton(this.step)
        });
    }
    render() {
        const { chartId } = this.props
        return (
            <div id={"chart" + chartId} style={{ width: 500, height: 300 }}></div>
        );
    }
}
function getNextEntity(e_space) {
    let set = new Set(e_space)

    return [...set]
}
function getNextRelation(r_space) {
    let set = new Set(r_space)
    return [...set]
}
function getActionProb(step, next_entity, next_relation) {
    const { next_e_space, next_r_space, aciton_dist } = step
    return aciton_dist.map((item, index) => {
        const e_id = next_e_space[index],
            r_id = next_r_space[index],
            e_index = next_entity.indexOf(e_id),
            r_index = next_relation.indexOf(r_id)

        return [e_index, r_index, item];
    })
}
function rebuild(data, msg) {
    let map = new Map()
    data.forEach(el => {
        msg === "node" ? map.set(el.id, el.name) : map.set(el.rel_id, el.name)

    })
    return map
}

function highLightCurAciton(step) {
    const { next_e_space, next_r_space } = step
    for (let i = 0; i < next_e_space.length; i++) {
        if (step.et_id === next_e_space[i] && next_r_space[i] === step.rel_id) {
            return i
        }

    }
}
export default CalendarChart;