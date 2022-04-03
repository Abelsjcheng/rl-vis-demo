import React from 'react'
import { Button, Card, Slider, InputNumber, Row, Col, Switch} from 'antd';
import { UnorderedListOutlined, CloseOutlined } from '@ant-design/icons';

// 图谱控制面板
class KgSettingPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showSettingCard: false, // 显示隐藏控制面板
            key: 'tab1', // 标签页索引
            Dropdownvisible: false,
        };
    }
    componentDidMount() {
        if (this.props.onImgRef)
            this.props.onImgRef(this);
    }
    handleCloseCard = (e) => {
        this.setState({ showSettingCard: false })
    }
    handleOpenCard = (e) => {
        this.setState({ showSettingCard: true });
    }
    onTabChange = (key, type) => {
        this.setState({ [type]: key });
    }

    render() {
        const { showSettingCard, key} = this.state
        const { forceSet, svgStyle, switchSet } = this.props;
        const tabList = [{ key: 'tab1', tab: '布局设置' }, { key: 'tab2', tab: "节点设置" }, { key: 'tab3', tab: "边设置" }]
        const labelSetList = [
            { title: '节点标签', type: 'showNodeText', data: switchSet.showNodeText },
            { title: '关系标签', type: 'showLinkText', data: switchSet.showLinkText },
            { title: '自适应缩放并居中', type: 'autoZoomFlag', data: switchSet.autoZoomFlag }
        ]
        const contentList = {
            tab1: <div className="kg-setting-title">
                <Row gutter={[0, 4]} justify="space-between">
                    <Col span={24} className="kg-setting-title">节点排斥力</Col>
                    <Col span={17}>
                        <Slider min={-3000} max={0} step={10} value={forceSet.bodyStrength} onChange={value => { this.props.onKgSettingChange({ value: value, forceSetType: 'bodyStrength' }, 'forceSet') }} />
                    </Col>
                    <Col span={6}>
                        <InputNumber min={-3000} max={0} step={10} value={forceSet.bodyStrength} onChange={value => { this.props.onKgSettingChange({ value: value, forceSetType: 'bodyStrength' }, 'forceSet') }} />
                    </Col>
                </Row>
                {
                    labelSetList.map((set, index) => {
                        return (
                            <Row key={index} justify="space-between" style={{ marginTop: '16px' }}>
                                <Col className="kg-setting-title" span={17}>
                                    {set.title}
                                </Col>
                                <Col span={6}>
                                    <Switch checked={set.data} onChange={value => this.props.onKgSettingChange({ value: value, switchSetType: set.type }, 'switchSet')} />
                                </Col>
                            </Row>
                        )
                    })
                }
            </div>,
            tab2: <div>
                <Row gutter={[0, 4]} justify="space-between">
                    <Col span={24} className="kg-setting-title">节点大小</Col>
                    <Col span={17}>
                        <Slider min={1} max={40} value={forceSet.nodeSize} onChange={value => this.props.onKgSettingChange({ value: value, forceSetType: 'nodeSize' }, 'forceSet')} />
                    </Col>
                    <Col span={6}>
                        <InputNumber min={1} max={40} value={forceSet.nodeSize} onChange={value => this.props.onKgSettingChange({ value: value, forceSetType: 'nodeSize' }, 'forceSet')} />
                    </Col>
                    <Col span={24} className="kg-setting-title">节点标签大小</Col>
                    <Col span={17}>
                        <Slider min={1} max={30} value={svgStyle.nodeLabelSize} onChange={value => this.props.onKgSettingChange({ value: value, svgStyleType: 'nodeLabelSize' }, 'svgStyle')} />
                    </Col>
                    <Col span={6}>
                        <InputNumber min={1} max={30} value={svgStyle.nodeLabelSize} onChange={value => this.props.onKgSettingChange({ value: value, svgStyleType: 'nodeLabelSize' }, 'svgStyle')} />
                    </Col>
                </Row>
            </div>,
            tab3: <div>
                <Row gutter={[0, 4]} justify="space-between">
                    <Col span={24} className="kg-setting-title">边宽度</Col>
                    <Col span={17}>
                        <Slider min={1} max={10} value={svgStyle.linkWidth} onChange={value => this.props.onKgSettingChange({ value, svgStyleType: 'linkWidth' }, "svgStyle")} />
                    </Col>
                    <Col span={6}>
                        <InputNumber min={1} max={10} value={svgStyle.linkWidth} onChange={value => this.props.onKgSettingChange({ value, svgStyleType: 'linkWidth' }, "svgStyle")} />
                    </Col>
                    <Col span={24} className="kg-setting-title">边长度</Col>
                    <Col span={17}>
                        <Slider min={0} max={400} step={10} value={forceSet.linkDistance} onChange={value => { this.props.onKgSettingChange({ value: value, forceSetType: 'linkDistance' }, 'forceSet') }} />
                    </Col>
                    <Col span={6}>
                        <InputNumber min={0} max={400} step={10} value={forceSet.linkDistance} onChange={value => { this.props.onKgSettingChange({ value: value, forceSetType: 'linkDistance' }, 'forceSet') }} />
                    </Col>
                    <Col span={24} className="kg-setting-title">边标签大小</Col>
                    <Col span={17}>
                        <Slider min={1} max={20} value={svgStyle.linkLabelSize} onChange={value => this.props.onKgSettingChange({ value, svgStyleType: 'linkLabelSize' }, "svgStyle")} />
                    </Col>
                    <Col span={6}>
                        <InputNumber min={1} max={20} value={svgStyle.linkLabelSize} onChange={value => this.props.onKgSettingChange({ value, svgStyleType: 'linkLabelSize' }, "svgStyle")} />
                    </Col>
                </Row>
            </div>
        }

        return (
            <div className="Kg-setting"  >
                <Button className="Kg-setting-btn" shape="circle" size="large" onClick={this.handleOpenCard} icon={<UnorderedListOutlined />} />
                <Card
                    size="small"
                    className="Kg-setting-card"
                    style={showSettingCard ? { display: '' } : { display: 'none' }}
                    bodyStyle={{ padding: "15px" }}
                    tabList={tabList}
                    activeTabKey={key}
                    tabBarExtraContent={<Button shape="circle" icon={<CloseOutlined />} onClick={this.handleCloseCard}></Button>}
                    onTabChange={key => {
                        this.onTabChange(key, 'key');
                    }}>
                    {contentList[this.state.key]}
                </Card>
            </div>
        )
    }
}


export default KgSettingPanel;