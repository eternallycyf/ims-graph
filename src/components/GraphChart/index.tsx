/* eslint-disable */

// TODO 多个图表 需要更换 element.id 为唯一值
import { CopyFilled } from '@ant-design/icons';
import { Popover, Table, theme, Tooltip, Typography } from 'antd';
import * as d3 from 'd3';
import _ from 'lodash';
import React, { useEffect } from 'react';
import FullScreen from './components/FullScreen';
import './index.less';
import { IGraphChartProps } from './interface';
import { downloadImpByChart } from './utils';
const { Paragraph } = Typography;

const defaultTheme = {
  expandColor: '#B3B8C2',
  tooltipTitleColor: '#DEE1E7',
  tooltipContentColor: '#2A303B',

  primary: '#2B5FDC',
  primaryWeight: 600,
  // 人员
  primaryDesalt: '#4D7FE3',
  primaryBg: '#F5F8FF',
  primaryBorderColor: '#E8F3FF',

  default: '#2A303B',
  defaultWeight: 400,
  // 人员
  defaultDesalt: '#5B6371',
  defaultBg: '#FAFAFB',
  defaultBorderColor: '#EFF1F4',
};

let dirRight: number;
let forUpward: any;
let leng: any;
let circlewidth1: any;
let circlewidth2: any;
let circlewidth3: any;
let margin1 = { top: 10, right: 10, bottom: -10, left: 10 };
let curTransform = {
  x: 0,
  y: 0,
  k: 1,
};

export default class StockTree extends React.PureComponent<IGraphChartProps, any> {
  svg: any = null;
  rootNode: any = { data: {}, r: {}, l: {} }; //左右2块数据源
  isShowTemplate: boolean = false;
  container: any = null; //容器svg>g
  duration: number = 500; //动画持续时间
  scaleRange: number[] = [0.2, 2]; //container缩放范围
  direction: string[] = ['r', 'l']; //分为左右2个方向
  centralPoint: number[] = [0, 0]; //画布中心点坐标x,y

  root: any = { data: {}, r: {}, l: {} }; //左右2块数据源
  rootNodeLength: number = 0; //根节点名称长度
  rootName: string[] = ['']; //根节点名称

  textSpace: number = 15; //多行文字间距
  nodeSize: number[] = [50, 100]; //节点间距(高/水平)
  fontSize: number = 12; //字体大小，也是单字所占宽高
  rectMinWidth: number = 50; //节点方框默认最小，
  textPadding: number = 7; //文字与方框间距,注：固定值5
  circleR: number = 5; //圆圈半径
  dirRight: string = '';

  treeData = [];

  constructor(props: any) {
    super(props);
    this.state = {
      isShowDetail: false,
      detailPosition: {
        top: 0,
        left: 0,
      },
      detailData: {},
    };
  }

  componentDidMount(): void {
    this.getData();
  }

  getData() {
    const data = this.convertToHierarchy(this.props.data);
    let left = data.l;
    let right = data.r;
    this.rootNode.data = data.root;
    this.rootName = [data.rootName];
    let mynodes;

    const recursion = (data: any, direction = -1) => {
      if (data.children) {
        data.children.forEach((item: any) => {
          if (item.children && item.children.length > 2) {
            mynodes = item.children;
            item.children = item.children.slice(0, 2);
            item.children[2] = {
              name: '展开',
              type: 1,
              val: mynodes.length - 2,
              id: direction + this.uuid(),
              childrend: mynodes.slice(0, mynodes.length),
            };
          }
          recursion(item);
        });
      }
      return data;
    };

    recursion(left, -1);
    recursion(right, 1);

    this.treeInit(data);
  }

  convertToHierarchy(data: any) {
    return {
      root: data,
      rootName: data.name,
      l: {
        name: 'origin',
        children: data.children.slice(0, ~~data.children.length / 2).map((item: any) => ({
          ...item,
          nodeType: 0,
        })),
      },
      r: {
        name: 'origin',
        children: data.children.slice(~~data.children.length / 2).map((item: any) => ({
          ...item,
          nodeType: 0,
        })),
      },
    };
  }

  //初始化
  treeInit(data: any) {
    // 初始化padding
    const margin = { top: -70, right: 0, bottom: 0, left: -100 };
    //@ts-ignore
    let treeWidth = d3.select('#treeRoot')._parents[0].clientWidth;
    //@ts-ignore
    let treeHeight = d3.select('#treeRoot')._parents[0].clientHeight;
    // const treeWidth = document.body.clientWidth - margin.left - margin.right; //tree容器宽
    // const treeHeight = document.body.clientHeight - margin.top - margin.bottom; //tree容器高
    const centralY = treeWidth / 2 + margin.left;
    const centralX = treeHeight / 2 + margin.top;
    this.centralPoint = [centralX, centralY]; //中心点坐标

    //根节点字符所占宽度
    this.rootNodeLength = this.rootName[0].length * this.fontSize + 50;

    //svg标签
    this.svg = d3
      .select('#treeRoot')
      .append('svg')
      .attr('id', 'svg')
      .attr('class', 'tree-svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('width', treeWidth)
      .attr('height', treeHeight)
      .attr('font-size', this.fontSize)
      .attr('fill', defaultTheme.defaultDesalt);

    //g标签
    const newContainer = this.svg
      .append('g')
      .attr('id', `container${this.props.chartType}`)
      .attr('class', 'container1')
      .attr('transform-origin', 'center')
      .attr(
        'transform',
        'translate(' + (margin1.left + margin1.right) / 2 + ',' + 200 + ')scale(0.8)',
      );

    this.container = newContainer;

    //画出根节点
    this.drawRoot();

    //指定缩放范围
    const zoom = d3
      .zoom()
      .scaleExtent(this.scaleRange as any)
      .on('zoom', (e) => this.zoomFn(e, newContainer));
    //动画持续时间
    this.container.transition().duration(this.duration).call(zoom.transform, d3.zoomIdentity);
    this.svg.call(zoom as any);
    this.dealData(data);
  }

  zoomFn(svg: any, container: any) {
    let newCurTransform = svg.transform;
    let x = newCurTransform.x / 2;
    let y = newCurTransform.y / 2;
    let scale = newCurTransform.k * 0.8;
    curTransform = {
      x,
      y,
      k: scale,
    };

    return container.attr('transform', 'translate(' + x + ',' + y + ')scale(' + scale + ')');
  }

  drawRoot() {
    let hoverTimer: string | number | NodeJS.Timeout | undefined;
    //eslint-disable-next-line
    let that = this;
    const title = this.container
      .append('g')
      .attr('id', 'rootTitle')
      .attr('transform', `translate(${this.centralPoint[1]},${this.centralPoint[0]})`);
    d3.select(`#rootTitle`)
      .on('mouseenter', function (e) {
        // let dom = document.getElementById('rootTitle')!;
        // let rect = dom.getBoundingClientRect();
        // if (hoverTimer) clearTimeout(hoverTimer);
        // hoverTimer = setTimeout(function () {
        //   that.setState({
        //     isShowDetail: true,
        //     detailPosition: {
        //       top: rect.top - 130,
        //       left: rect.left < (window.innerWidth - rect.width) / 2 ? rect.right : rect.left - 300,
        //     },
        //     detailData: rootNode.data,
        //   });
        // }, 500);
      })
      .on('mouseleave', function () {
        // if (hoverTimer) clearTimeout(hoverTimer);
        // setTimeout(() => {
        //   that.setState({ isShowDetail: false });
        // }, 500);
      });
    title
      .append('svg:rect')
      .attr('class', 'rootTitle')
      .attr('y', 0)
      .attr('x', -this.rootNodeLength / 2)
      .attr('width', this.rootNodeLength)
      .attr('height', 0)
      .attr('rx', 2) //圆角
      .style('fill', defaultTheme.primary);
    this.rootName.forEach((name, index) => {
      title
        .append('text')
        .attr('fill', 'white')
        .attr('y', function () {
          return 5;
        })
        .attr('text-anchor', 'middle')
        .style('font-size', 14)
        .style('font-weight', '700')
        .text(name);

      let lineHeight = (index + 2) * this.textSpace;
      d3.select('#rootTitle rect')
        .attr('height', lineHeight)
        .attr('y', -lineHeight / 2);
    });
  }

  //数据处理
  dealData(data: any) {
    this.direction.forEach((item) => {
      this.rootNode[item] = d3.hierarchy(data[item]);
      this.rootNode[item]._children = this.rootNode[item].children;
      this.rootNode[item].x0 = this.centralPoint[0]; //根节点x坐标
      this.rootNode[item].y0 = this.centralPoint[1]; //根节点Y坐标
      this.porData(this.rootNode[item], item);
    });
  }

  uuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  //遍历
  porData(obj: any, item: any) {
    obj.descendants().forEach((d: any) => {
      d._children = d.children;
      d.id = d.data.id ? d.data.id : item + this.uuid();
    });
    this.update(obj, item);
  }

  //节点间距: 垂直
  treeMap(root: any) {
    return d3
      .tree()
      .nodeSize(this.nodeSize as any)
      .separation((a, b) => {
        let result = a.parent === b.parent && !a.children && !b.children ? 0.8 : 1;
        return result;
      })(root);
  }

  //开始绘图
  update(source: any, direction: any) {
    //eslint-disable-next-line
    let that = this;
    dirRight = direction === 'r' ? 1 : -1; //方向为右/左
    forUpward = direction == 'r';
    let className = `${direction}gNode`;

    //@ts-ignore
    let tree = this.treeMap(this.rootNode[direction]);
    let nodes = tree.descendants();
    let links = tree.links();

    let data = [];
    if (nodes.length > 1) {
      for (let i = 0; i < nodes.length; i++) {
        if (!data[nodes[i].depth]) {
          let arr = [];
          arr.push(nodes[i]);
          data[nodes[i].depth] = arr;
        } else {
          data[nodes[i].depth].push(nodes[i]);
        }
      }
      //检测最大长度
      // this.testLength(data, dirRight);
    }

    //节点间距: 水平;
    nodes.forEach((d) => {
      let spaceWidth = 0;
      if (d.depth == 1) {
        spaceWidth = -50;
      } else if (d.depth == 2) {
        spaceWidth = 50;
      } else {
        spaceWidth = 135;
        if (d.depth > 3) {
          spaceWidth = spaceWidth + d.depth * 10;
        }
      }
      let space = dirRight * (d.depth === 0 ? 0 : d.depth * spaceWidth);
      d.y = dirRight * (d.y + this.rootNodeLength / 2) + this.centralPoint[1] + space;
      d.x = d.x + this.centralPoint[0];
    });

    const node = d3
      .select(`#container${that.props.chartType}`)
      .selectAll(`g.${className}`)
      .data(nodes, (d: any) => d.id);

    const nodeEnter = node
      .enter()
      .append('g')
      .attr('id', (d: any) => `g${d.id}`)
      .attr('class', className)
      .attr('transform', (d: any) => {
        return `translate(${source.y0},${source.x0})`;
      })
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .on('click', function (data: any) {
        const d = (data.currentTarget || data.currentTarget).__data__;
        //@ts-ignore
        d3.select(this)
          .selectAll('.node-circle .node-circle-vertical')
          .transition()
          .duration(that.duration)
          .attr('stroke-width', function (d: any) {
            if (d.children) {
              return 1;
            } else {
              return 0;
            }
          });

        if (d.data.name === '展开') {
          return that.clickNode(d, direction, source);
        } else if (d.depth !== 0) {
          if (d.data.name == '收起') {
            return that.expandReset(d, direction, source);
          }
          return that.clickNode(d, direction, source);
        }
      });

    nodeEnter.each((d: any) => {
      if (d.depth > 0) {
        this.drawText(`g${d.id}`, dirRight);
        // if (d.data.attName) {
        //   this.drawCodeText(`g${d.id}`, dirRight);
        // }
        // if (d.data.percent) {
        //   this.drawTsText(`g${d.id}`, dirRight);
        // }

        this.drawRect(`g${d.id}`, dirRight);
        // this.marker(`g${d.id}`, dirRight);
      }

      if (d.depth > 0) {
        const width = Math.min(d.data.name.length * 14, this.rectMinWidth);
        let right = dirRight > 0;
        let xDistance = right ? width : -width;
        if (d._children) {
          this.drawCircle(`g${d.id}`, dirRight, source, direction);
        }
        if (['展开', '收起'].includes(d.data.name)) {
          this.drawCircle(`g${d.id}`, dirRight, source, direction);
        }
        // this.drawSign(`g${d.id}`, dirRight); //画标记
      }

      //画节点数量
      if (d.data && ['展开', '收起'].includes(d.data.name)) {
        this.drawLength(`g${d.id}`);
      }
    });

    // 更新节点：节点enter和exit时都会触发tree更新
    const nodeUpdate = node
      .merge(nodeEnter as any)
      .transition()
      .duration(this.duration)
      .attr('transform', (d: any) => {
        if (d.data && d.data.isNextNode) {
          //@ts-ignore
          d3.select(this)
            .select(`#container${that.props.chartType}`)
            .selectAll('.node-circle .node-circle-vertical')
            .transition()
            .duration(this.duration)
            .attr('stroke-width', function (d: any) {
              if (d.children) {
                return 0;
              } else {
                return 1;
              }
            });
        }

        let index = 0;
        return 'translate(' + d.y + ',' + d.x + ')';
      })
      .attr('fill-opacity', 1)
      .attr('stroke-opacity', 1);

    const nodeExit = node
      .exit()
      .transition()
      .duration(this.duration)
      .remove()
      .attr('transform', (d: any) => `translate(${source.y},${source.x})`)
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0);

    // Update the links 根据 className来实现分块更新
    const link = this.container
      .selectAll(`path.${className}`)
      .data(links, (d: any) => d.target.id || d.currentTarget.id);

    // Enter any new links at the parent's previous position.
    //insert是在g标签前面插入，防止连接线挡住G节点内容
    const linkEnter = link
      .enter()
      .insert('path', 'g')
      .attr('class', className)
      // .attr('d', (d: any) => {
      //   const o = { x: source.x0, y: source.y0 };

      //   return this.diagonal({ source: o, currentTarget: o });
      // })
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .attr('stroke', '#DEE1E7');

    // Transition links to their new position.
    link.merge(linkEnter).transition().duration(this.duration).attr('d', this.diagonal);

    link
      .exit()
      .transition()
      .duration(this.duration)
      .remove()
      .attr('d', (d: any) => {
        const o = { x: source.x, y: source.y };

        return this.diagonal({ source: o, currentTarget: o });
      });

    // Stash the old positions for transition.
    //@ts-ignore
    this.rootNode[direction].eachBefore((d: any) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }
  //画连接线
  diagonal({ source, currentTarget, target }: any) {
    let s = source,
      d = currentTarget || target;

    if (forUpward) {
      return (
        'M' +
        s.y +
        ',' +
        s.x +
        'L' +
        (s.y + (d.y - s.y) - 20) +
        ',' +
        s.x +
        'L' +
        (s.y + (d.y - s.y) - 20) +
        ',' +
        d.x +
        'L' +
        d.y +
        ',' +
        d.x
      );
    } else {
      return (
        'M' +
        s.y +
        ',' +
        s.x +
        'L' +
        (s.y + (d.y - s.y) + 20) +
        ',' +
        s.x +
        'L' +
        (s.y + (d.y - s.y) + 20) +
        ',' +
        d.x +
        'L' +
        d.y +
        ',' +
        d.x
      );
    }
  }
  //画文本
  drawText(id: string, dirRight: any) {
    //eslint-disable-next-line
    let that = this;
    //eslint-disable-next-line
    dirRight = dirRight > 0; //右为1，左为-1
    return (
      d3
        .select(`#${id}`)
        .append('text')
        .attr('y', (d: any) => {
          if (d.data.percent) {
            return that.textPadding - 20;
          } else {
            return that.textPadding;
          }
        })
        .attr('x', (d: any) => {
          if (d.data.children?.length != 0) {
            return dirRight ? that.textPadding + 17 : -that.textPadding - 17;
          }
          if (['展开', '收起'].includes(d.data.name)) {
            return dirRight ? that.textPadding : -that.textPadding;
          }
          return dirRight ? that.textPadding : -that.textPadding;
        })
        .attr('text-anchor', dirRight ? 'start' : 'end')
        .style('font-size', () => {
          return 14;
        })
        .style('font-weight', (d: any) => {
          const isLastChildNode = that.getIsLastChildNode(d);
          if (['展开', '收起'].includes(d.data.name)) {
            return defaultTheme.defaultWeight;
          }
          if (isLastChildNode) {
            return defaultTheme.primaryWeight;
          }
          return defaultTheme.defaultWeight;
        })
        .style('fill', (d: any) => {
          const isLast = that.getIsLastChildNode(d);
          if (['展开', '收起'].includes(d.data.name)) {
            return '#8E96A4';
          }
          if (isLast) {
            return defaultTheme.primary;
          } else {
            return defaultTheme.default;
          }
        })
        .style('height', 5)
        .attr('class', 'text')
        // .text(function (d: any) {
        //   const len = d.data.name.length;
        //   if (len > 20) {
        //     return d.data.name.substring(0, 20) + '...';
        //   } else {
        //     return d.data.name;
        //   }
        // })
        .attr('width', function (d) {
          //@ts-ignore
          circlewidth1 = d3.select(this.getComputedTextLength())._groups[0][0];
          //@ts-ignore
          return d3.select(this.getComputedTextLength())._groups[0][0];
        })
        .html(function (d: any) {
          let name = d.data.name;
          let personName = d?.data?.keyPersonName ?? '';
          const len = name.length;
          let str = '';

          const isLast = !that.getIsLastChildNode(d);
          if (isLast && that.props.chartType == '2') {
            name = `${d?.data?.title ? d?.data?.title + '：' : ''}${name}`;
          }

          if (len > 20) {
            str = name.substring(0, 20) + '...';
          } else {
            str = name;
          }

          if (personName && personName.length > 7 && personName.includes('、')) {
            personName = d.data.keyPersonName.substring(0, 7) + '...';
          }

          return `${str}${`<tspan 
            fill="${defaultTheme.primaryDesalt}"
            style="font-size: 12px; font-weight: 400;"
          >&nbsp;${personName ? '[' + personName + ']' : ''}</tspan>
        `}`;
        })
    );
  }
  //画股票代码
  drawCodeText(id: string, dirRight: any) {
    // eslint-disable-next-line
    const that = this;
    return (
      d3
        .select(`#${id} text`)
        .append('tspan')
        .attr('fill', (d) => '#fff')
        //@ts-ignore
        .attr('y', function (d: any) {
          if (d.data.percent) {
            return that.textPadding + 8;
          }
        })
        .style('font-size', '11px')
        .attr('x', function (d) {
          if (dirRight > 0) {
            return that.textPadding;
          } else {
            return -5;
          }
        })
        .text(function (d: any) {
          return d.data.attName + ' ';
        })

        .attr('width', function (d) {
          //@ts-ignore
          circlewidth3 = d3.select(this.getComputedTextLength())._groups[0][0];
          //@ts-ignore
          return d3.select(this.getComputedTextLength())._groups[0][0];
        })
    );
  }
  //画子文本
  drawTsText(id: any, dirRight: any) {
    //eslint-disable-next-line
    let that = this;
    return (
      d3
        .select(`#${id} text`)
        .append('tspan')
        .attr('fill', (d: any) => (d.data.attName ? '#fff' : '#F9B023'))
        //@ts-ignore
        .attr('y', function (d: any) {
          return that.textPadding;
        })
        .attr('x', function (d) {
          if (dirRight > 0) {
            return that.textPadding;
          } else {
            return -5;
          }
        })
        .style('font-size', '11px')
        .style('color', '#F9B023')
        .text(function (d: any) {
          return d.data.percent;
        })

        .attr('width', function (d) {
          //@ts-ignore
          circlewidth2 = d3.select(this.getComputedTextLength())._groups[0][0];
          //@ts-ignore
          return d3.select(this.getComputedTextLength())._groups[0][0];
        })
    );
  }
  //画方框
  drawRect(id: string, dirRight: any) {
    //eslint-disable-next-line
    let that = this;
    let hoverTimer: string | number | NodeJS.Timeout | undefined;

    //@ts-ignore
    let realw = document.getElementById(id)!.getBBox().width + 16; //获取g实际宽度后，设置rect宽度
    //@ts-ignore
    if (document.getElementById(id).getBBox().width > 400) {
      realw = 400;
    }

    const g = d3
      .select(`#${id}`)
      .on('mouseenter', function (e) {
        const data = (e.target || e.currentTarget).__data__.data;
        const depth = (e.target || e.currentTarget).__data__.depth;
        let dom = document.getElementById(id)!;
        let rect = dom.getBoundingClientRect();
        hoverTimer = setTimeout(function () {
          that.setState({
            isShowDetail: true,
            detailPosition: {
              top: rect.top,
              left: rect.left,
              // top: rect.top - 130,
              // left: rect.left < (window.innerWidth - rect.width) / 2 ? rect.right : rect.left - 300,
            },
            detailData: {
              ...data,
              depth,
            },
          });
        }, 500);
      })
      .on('mouseleave', function (e) {
        if (e.toElement?.className == 'detail') return;
        if (hoverTimer) clearTimeout(hoverTimer);
        setTimeout(() => {
          that.setState({
            isShowDetail: false,
          });
        }, 500);
      });

    return g
      .insert('rect', 'text')
      .attr('x', (d: any) => {
        if (['展开', '收起'].includes(d.data.name)) {
          return dirRight < 0 ? -realw - 35 : -realw + 45;
        }

        if (dirRight < 0) {
          if (d?.data?.children?.length != 0) {
            return -realw - 15;
          }
          return -realw;
        } else {
          return 0;
        }
      })
      .attr('y', function (d: any) {
        if (d.data.percent) {
          return -that.textSpace + that.textPadding - 19;
        } else {
          return -that.textSpace + that.textPadding - 4;
        }
      })
      .attr('width', function (d: any) {
        if (['展开', '收起'].includes(d.data.name)) {
          if (d?.data?.childrend?.length >= 10) {
            return realw + 39;
          }
          return realw + 35;
        }
        if (d?.data?.children?.length != 0) {
          return realw + 15;
        }
        return realw;
      })
      .attr('height', function (d: any) {
        if (d.data.percent) {
          return that.textSpace + that.textPadding + 22;
        } else {
          return that.textSpace + that.textPadding + 8;
        }
      })
      .attr('stroke-width', (d: any) => 1)
      .attr('rx', 2) //圆角

      .style('stroke', (d: any) => {
        const isLast = that.getIsLastChildNode(d);
        if (isLast) {
          return defaultTheme.primaryBorderColor;
        } else {
          return defaultTheme.defaultBorderColor;
        }
      })
      .style('fill', function (d: any) {
        const isLast = that.getIsLastChildNode(d);
        if (isLast) {
          return defaultTheme.primaryBg;
        } else {
          return defaultTheme.defaultBg;
        }
      });
  }
  //画箭头
  marker(id: any, dirRight: any) {
    let gMark = d3
      .select(`#${id}`)
      .append('g')
      .attr('transform', dirRight > 0 ? 'translate(-20,0)' : 'translate(12,0)');
    return (
      gMark
        .insert('path', 'text')
        //@ts-ignore
        .attr('d', function (d: any) {
          if (d.data.nodeType == 0 && dirRight > 0) {
            return 'M0,0L0,3L9,0L0,-3Z';
          } else if (d.data.nodeType == 0 && dirRight < 0) {
            return 'M0,0L9,-3L9,3Z';
          }
        })
        .style('fill', (d: any) => this.getRectStorke(d.data.name))
    );
  }
  //画circle
  drawCircle(id: string, dirRight: number, source: any, direction: any) {
    let gMark = d3
      .select(`#${id}`)
      .append('g')
      .attr('class', 'node-circle')
      .attr('stroke', defaultTheme.expandColor)
      .attr('transform', function (d: any) {
        leng = Number(circlewidth1) + 15;

        if (d.data.val <= 10) {
          leng = leng - 5;
        }
        if (dirRight == 1) {
          return 'translate(' + leng + ',3)';
        } else {
          return 'translate(' + -leng + ',3)';
        }
      })
      // .attr('stroke-width', (d) => (d.data.isNextNode ? 1 : 0)); //判断是否有下级节点
      .attr('stroke-width', (d: any) => (d.data.type == '-1' ? 0 : 1));

    gMark
      .append('circle')
      .attr('fill', 'none')
      .attr('r', function (d: any) {
        if (d.data.type == '-1') {
          return 0;
        }
        return 5;
      }) //根节点不设置圆圈
      .attr('fill', '#ffffff');
    let padding = this.circleR - 2;

    gMark.append('path').attr('d', `m -${padding} 0 l ${2 * padding} 0`); //横线

    gMark
      .append('path') //竖线，根据展开/收缩动态控制显示
      .attr('d', `m 0 -${padding} l 0 ${2 * padding}`)
      .attr('stroke-width', function (d: any) {
        if (d.data.name == '收起' || (d?.data?.children?.length != 0 && d.data.name != '展开')) {
          return 0;
        }
        return 1;
      })
      .attr('class', 'node-circle-vertical');
    return gMark;
  }
  //华标记
  drawSign(id: any, dirRight: number) {
    return (
      d3
        .select(`#${id}`)
        .insert('circle', 'text')
        .attr('cx', dirRight > 0 ? -5 : 5)
        .attr('y', -2.5)
        //@ts-ignore
        .attr('r', function (d: any) {
          if (d.data.nodeType == 0) {
            return 4;
          }
        })
        .style('fill', (d: any) => this.getRectStorke(d.data.name))
    );
  }
  //节点数量
  drawLength(id: string) {
    return d3
      .select(`#${id} text`)
      .append('tspan')
      .attr('fill', (d) => '#999')
      .text(function (d: any) {
        return '(' + d.data.val + ')';
      })
      .attr('fill', '#8E96A4')
      .attr('width', function (d: any) {
        //@ts-ignore
        return d3.select(this.getComputedTextLength())._groups[0];
      });
  }

  //末 节点 边框颜色
  getRectStorke(name: any) {
    return '#EFF1F4';
    switch (name) {
      case '分支机构':
        return 'rgb(255, 234, 218)';
      case '对外投资':
        return 'rgb(215, 236, 255)';
      case '股东':
        return 'rgb(211, 234, 241)';
      case '高管':
        return 'rgb(237, 227, 244)';
      default:
        return 'rgb(133, 165, 255)';
    }
  }

  testLength(data: any, dirRight: any) {
    let level = [],
      width1,
      width2,
      width3;

    for (let i = 0; i < data.length; i++) {
      let newArr = new Array();

      for (let j = 0; j < data[i].length; j++) {
        if (data[i][j].data.attName) {
          this.svg
            .append('text')
            .style('font-size', this.fontSize)
            .text((d: any) => '(' + data[i][j].data.attName + ')')
            .attr('class', 'test')
            .attr('width', function (d: any) {
              //@ts-ignore
              return d3.select(this.getComputedTextLength())._groups[0][0];
              // console.log(width3,"width3");
            });
        }
        if (data[i][j].data.percent) {
          this.svg
            .append('text')
            .style('font-size', this.fontSize)
            .text(function (d: any) {
              const len = data[i][j].data.name.length;
              if (len > 20) {
                return data[i][j].data.name.substring(0, 20) + '...';
              } else {
                return data[i][j].data.name;
              }
            })
            .attr('class', 'test')
            //eslint-disable-next-line
            .attr('width', function (d: any) {
              //@ts-ignore
              width1 = d3.select(this.getComputedTextLength())._groups[0][0];
            });
          this.svg
            .append('text')
            .style('font-size', this.fontSize)
            .text((d: any) => data[i][j].data.percent)
            .attr('class', 'test')
            //eslint-disable-next-line
            .attr('width', function (d: any) {
              //@ts-ignore
              width2 = d3.select(this.getComputedTextLength())._groups[0][0];
            });

          // $('.test').remove();
          if (data[i][j].data.attName) {
            if (Number(width1) + Number(width3) > Number(width2)) {
              newArr.push(Number(width1) + Number(width3) + 100);
            } else {
              newArr.push(Number(width2) + 100);
            }
          } else {
            if (Number(width1) > Number(width2)) {
              newArr.push(Number(width1) + 100);
            } else {
              newArr.push(Number(width2) + 100);
            }
          }
        } else {
          this.svg
            .append('text')
            .style('font-size', this.fontSize)
            .text(function (d: any) {
              if (data[i][j].data.name) {
                const len = data[i][j].data.name.length;
                if (len > 20) {
                  return data[i][j].data.name.substring(0, 20) + '...';
                } else {
                  return data[i][j].data.name;
                }
              }
            })
            .attr('class', 'test')
            //eslint-disable-next-line
            .attr('width', function (d: any) {
              //@ts-ignore
              width1 = d3.select(this.getComputedTextLength())._groups[0];

              newArr.push(Number(width1) + 100);
              //@ts-ignore
              data.width1 = d3.select(this.getComputedTextLength())._groups[0];
            });
          // $('.test').remove();
        }
      }
      level.push(Math.max.apply(null, newArr));
    }
    this.seat(level, dirRight, data);
  }

  seat(newArr: string | any[], dirRight: any, data: { y: any }[][]) {
    for (var j = 0; j < newArr.length; j++) {
      if (j != 0) {
        for (var i = 0; i < data[j].length; i++) {
          data[j][i].y = data[j - 1][0].y + newArr[j - 1] - 40;
        }
      }
    }
  }
  //数据重组
  DataReor(d: any, direction: any, source: any, appendData: any) {
    let setDepth = function (node: d3.HierarchyNode<any>, num: number, appendLeaf: any[]) {
      //重新设置depth
      //@ts-ignore
      node.depth = num;
      if (node.children && node.children.length) {
        //遍历children
        node.children.forEach(function (item: any) {
          setDepth(item, num + 1, appendLeaf);
        });
      } else {
        appendLeaf.push(node);
      }
    };

    let setHeight = function (arr: any[], num: number) {
      //重新设置height
      let parent: any[] = [];
      arr.forEach(function (node: { height: number; parent: any }) {
        node.height = Math.max(num, node.height);
        if (node.parent && parent.indexOf(node.parent) == -1) {
          parent.push(node.parent);
        }
      });

      if (parent.length) {
        setHeight(parent, num + 1);
      }
    };

    let appendLeaf: any = []; //增加的叶子节点

    if (appendData.children.length) {
      d.children = [];
      appendData.children.forEach(function (item: any, index: any) {
        let newNode = d3.hierarchy(item);
        newNode.parent = d;
        //@ts-ignore
        newNode.height = -1;
        setDepth(newNode, d.depth + 1, appendLeaf);
        d.children.push(newNode);
      });
    }

    if (appendLeaf.length) {
      setHeight(appendLeaf, 0);
    }

    if (source.data.name == '展开') {
      source.parent.descendants().forEach((d: { _children: any; children: any; id: string }) => {
        d._children = d.children;
        d.id = direction + this.uuid();
      });
    } else {
      source.descendants().forEach((d: { _children: any; children: any; id: string }) => {
        d._children = d.children;
        d.id = direction + this.uuid();
      });
    }
    this.update(d, direction);
  }
  expandReset(d: any, direction: any, source: any) {
    let arr = d.data.childrend.slice(0, 2);
    arr[2] = {
      name: '展开',
      type: 1,
      val: d.data.val,
      childrend: d.data.childrend,
    };
    this.DataReor(d.parent, direction, source, {
      children: arr,
    });
  }
  getNode(d: any, direction: any, source: any, type: number | undefined) {
    if (d.data.name === '展开') {
      let arr;
      if (d.data.val <= 2) {
        arr = d.data.childrend;
      } else {
        arr = d.data.childrend;
      }

      if (
        arr?.filter((item: any) => !['展开', '收起'].includes(item.name))?.length ==
        d.data.childrend?.length
      ) {
        arr[arr.length + 1] = {
          name: '收起',
          type: 1,
          val: d.parent.children.slice(-1)?.[0]?.data?.val || 0,
          childrend: arr,
        };
      }

      this.DataReor(d.parent, direction, source, {
        children: arr,
      });
    } else {
      let data = d.data;
      let mynodes = data;
      if (data.length > 5) {
        data = data.slice(0, 5);
        data[11] = {
          name: '搜索',
          type: -1,
          val: mynodes.length - 5,
          childrend: mynodes.slice(0, mynodes.length),
        };
      }
      this.DataReor(d, direction, source, {
        children: data,
      });
    }
  }
  expand(d: any, direction: any, source: any) {
    this.isShowTemplate = false;
    if (d.data.name == '展开') {
      //@ts-ignore
      this.getNode(d, direction, source);
      return;
    }
    if (d._children) {
      d.children = d._children;

      d._children = null;
      this.update(d, direction);
    }
  }

  collapse(d: any, direction: any, obj: number) {
    this.isShowTemplate = false;
    if (d.children) {
      d._children = d.children;
      d.children = null;
    }
    if (obj == 1) {
      this.update(d, direction);
    }
  }
  clickNode(d: any, direction: any, source: any) {
    if (d.children) {
      this.collapse(d, direction, 1);
    } else {
      this.expand(d, direction, source);
    }
  }

  setType(type: number) {
    this.setState(
      {
        type,
      },
      () => this.zoomClick(type),
    );
  }

  zoomClick(type: number) {
    let c1 = curTransform.k;
    let c2 = Number((c1 + 0.2 * type).toFixed(1));
    curTransform.k = c2;
    //eslint-disable-next-line
    let that = this;
    return d3
      .transition()
      .duration(350)
      .tween('zoom', function () {
        let i = d3.interpolate(c1, c2);
        return function (t) {
          that.container.attr(
            'transform',
            'translate(' +
              curTransform.x / 2 +
              ',' +
              curTransform.y / 2 +
              ')scale(' +
              i(t) * 0.8 +
              ')',
          );
        };
      });
  }

  exportImg() {
    downloadImpByChart(document.getElementById('svg') as any, '企业构成图', 'xxx');
  }

  getIsLastChildNode(d: any) {
    const { chartType = '1' } = this.props;
    if (chartType == '1') {
      return (
        d?.data?.children?.length == 0 && d.depth == 3 && !['展开', '收起'].includes(d.data.name)
      );
    }
    if (chartType == '2') {
      return d?.data?.children?.length != 0 && !['展开', '收起'].includes(d.data.name);
    }
    return false;
  }

  renderDetail() {
    const { isShowDetail, detailPosition, detailData } = this.state;
    if (!isShowDetail) return null;

    if (['展开', '收起'].includes(detailData.name)) {
      return false;
    }

    return (
      <div
        onMouseLeave={() => this.setState({ isShowDetail: false })}
        className={'detail'}
        style={{ top: detailPosition?.top - 58, left: detailPosition?.left }}
      >
        <div>
          <span className={'content'}>{detailData?.title ?? '--'}:</span>
          <span className={'title'}>&nbsp;{detailData?.name ?? '--'}</span>
        </div>

        {detailData?.keyPersonName && (
          <div>
            <span className={'content'}>关键人:</span>
            <span className={'title'}>&nbsp; {detailData?.keyPersonName ?? '--'}</span>
          </div>
        )}
      </div>
    );
  }

  render(): React.ReactNode {
    return (
      <div id="graph" className={'tree04'} style={{ position: 'relative' }}>
        <div className={'floatButton'}>
          <FullScreen className={'button'} />
          <Tooltip placement="left" title="放大">
            <div className={'button'} onClick={() => this.setType(1)}>
              <svg
                width="16px"
                height="16px"
                viewBox="0 0 16 16"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>放大</title>
                <g id="1023版本" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                  <g id="图谱" transform="translate(-1548.000000, -824.000000)">
                    <g id="编组-4备份" transform="translate(1544.000000, 820.000000)">
                      <g id="1.icon/24/全屏备份" transform="translate(4.000000, 4.000000)">
                        <rect id="矩形" x="0" y="0" width="16" height="16"></rect>
                        <path
                          d="M7.77777778,3.53333333 C10.1219107,3.53333333 12.0222222,5.43364489 12.0222222,7.77777778 C12.0222222,8.78160502 11.6737419,9.70404402 11.0911579,10.430718 L12.7092943,12.0493502 L12.0493279,12.7093165 L10.430718,11.0911579 C9.70404402,11.6737419 8.78160502,12.0222222 7.77777778,12.0222222 C5.43364489,12.0222222 3.53333333,10.1219107 3.53333333,7.77777778 C3.53333333,5.43364489 5.43364489,3.53333333 7.77777778,3.53333333 Z M7.77777778,4.46666667 C5.94911066,4.46666667 4.46666667,5.94911066 4.46666667,7.77777778 C4.46666667,9.60644489 5.94911066,11.0888889 7.77777778,11.0888889 C9.60644489,11.0888889 11.0888889,9.60644489 11.0888889,7.77777778 C11.0888889,5.94911066 9.60644489,4.46666667 7.77777778,4.46666667 Z M8.24444444,6.44444444 L8.24433333,7.31133333 L9.11050366,7.31111151 L9.11171857,8.24444405 L8.24433333,8.24533333 L8.24444444,9.11111111 L7.31111111,9.11111111 L7.31033333,8.24633333 L6.44851857,8.24791072 L6.44730366,7.31457817 L7.31033333,7.31333333 L7.31111111,6.44444444 L8.24444444,6.44444444 Z"
                          id="形状结合"
                          fill="#5B6371"
                          fill-rule="nonzero"
                        ></path>
                      </g>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </Tooltip>
          <Tooltip placement="left" title="缩小">
            <div className={'button'} onClick={() => this.setType(-1)}>
              <svg
                width="16px"
                height="16px"
                viewBox="0 0 16 16"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>缩小</title>
                <g id="1023版本" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                  <g id="图谱" transform="translate(-1548.000000, -848.000000)">
                    <g id="编组-4备份-2" transform="translate(1544.000000, 844.000000)">
                      <g id="1.icon/24/全屏备份-2" transform="translate(4.000000, 4.000000)">
                        <rect id="矩形" x="0" y="0" width="16" height="16"></rect>
                        <path
                          d="M7.77777778,3.53333333 C10.1219107,3.53333333 12.0222222,5.43364489 12.0222222,7.77777778 C12.0222222,8.78160502 11.6737419,9.70404402 11.0911579,10.430718 L12.7092943,12.0493502 L12.0493279,12.7093165 L10.430718,11.0911579 C9.70404402,11.6737419 8.78160502,12.0222222 7.77777778,12.0222222 C5.43364489,12.0222222 3.53333333,10.1219107 3.53333333,7.77777778 C3.53333333,5.43364489 5.43364489,3.53333333 7.77777778,3.53333333 Z M7.77777778,4.46666667 C5.94911066,4.46666667 4.46666667,5.94911066 4.46666667,7.77777778 C4.46666667,9.60644489 5.94911066,11.0888889 7.77777778,11.0888889 C9.60644489,11.0888889 11.0888889,9.60644489 11.0888889,7.77777778 C11.0888889,5.94911066 9.60644489,4.46666667 7.77777778,4.46666667 Z M9.11111111,7.31111111 L9.11111111,8.24444444 L6.44444444,8.24444444 L6.44444444,7.31111111 L9.11111111,7.31111111 Z"
                          id="形状结合"
                          fill="#5B6371"
                          fill-rule="nonzero"
                        ></path>
                      </g>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </Tooltip>
          {/* <div className={styles.button} onClick={this.exportImg}>
            导出
          </div> */}
        </div>
        {this.renderDetail()}
        <div id="treeRoot"></div>
      </div>
    );
  }
}
