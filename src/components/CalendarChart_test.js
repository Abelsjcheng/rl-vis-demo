import React from 'react';
import * as echarts from 'echarts';
import aciton_space from '../case/lebron_james_test_action_space.json'
import lebron_james_test from '../case/lebron_james_test.json'
class CalendarChart extends React.Component {
    constructor(props) {
        super(props);
        this.nodes = buildMapForFind(lebron_james_test.nodes, 'node')
        this.links = buildMapForFind(lebron_james_test.links, 'link')
        this.next_entity = getNextEntity(props.action.cur_eid)
        this.next_relation = getNextRelation(props.action.cur_eid)
        this.action_prob = getActionProb(props.action.cur_eid, this.next_entity, this.next_relation)
        this.state = {

        }
    }
    componentDidMount() {
        this.initCalendarChart()
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.action.cur_eid !== nextProps.action.cur_eid) {
            this.next_entity = getNextEntity(nextProps.action.cur_eid)
            this.next_relation = getNextRelation(nextProps.action.cur_eid)
            this.action_prob = getActionProb(nextProps.action.cur_eid, this.next_entity, this.next_relation)
            this.initCalendarChart()
        }

    }
    initCalendarChart() {
        const { chartId, action } = this.props
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
            dataIndex: highLightCurAciton(action)
        });
    }
    render() {
        const { chartId } = this.props
        return (
            <div id={"chart" + chartId} style={{ width: 500, height: 300 }}></div>
        );
    }
}
function getNextEntity(cur_eid) {
    let set = new Set(aciton_space[cur_eid].e_space)
    return [...set]
}
function getNextRelation(cur_eid) {
    let set = new Set(aciton_space[cur_eid].r_space)
    return [...set]
}
function getActionProb(cur_eid, next_entity, next_relation) {
    return aciton_space[cur_eid].action_dist.map((item, index) => {
        const e_id = aciton_space[cur_eid].e_space[index],
            r_id = aciton_space[cur_eid].r_space[index],
            e_index = next_entity.indexOf(e_id),
            r_index = next_relation.indexOf(r_id)

        return [e_index, r_index, item];
    })
}
function buildMapForFind(data, msg) {
    let map = new Map()
    data.forEach(el => {
        msg === "node" ? map.set(el.id, el.name) : map.set(el.rel_id, el.name)

    })
    return map
}
function highLightCurAciton(action) {
    const e_space = aciton_space[action.cur_eid].e_space,
        r_space = aciton_space[action.cur_eid].r_space
    for (let i = 0; i < e_space.length; i++) {
        if (action.et_id === e_space[i] && r_space[i] === action.rel_id) {
            return i
        }

    }
}
export default CalendarChart;