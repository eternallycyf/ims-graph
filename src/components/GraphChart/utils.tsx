/* eslint-disable */

/**
 * 事件绑定
 * @param target
 * @param eventType
 * @param callback
 * @returns {{remove(): void}}
 */
export const addEvent = (target: any, eventType: string, callback: () => void) => {
  if (target.addEventListener) {
    target.addEventListener(eventType, callback, false);
    return {
      remove() {
        target.removeEventListener(eventType, callback, false);
      },
    };
  } else if (target.attachEvent) {
    target.attachEvent('on' + eventType, callback);
    return {
      remove() {
        target.detachEvent('on' + eventType, callback);
      },
    };
  }
};

export const downloadSvgFn = (
  svg: SVGAElement,
  width: number,
  height: number,
  chartName: string,
  rootName: string,
) => {
  var serializer = new XMLSerializer();
  var source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(svg);
  var image = new Image();
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
  image.onload = function () {
    var canvas = document.createElement('canvas');
    var ratio = window.devicePixelRatio || 2;
    canvas.width = (width + 40) * ratio;
    canvas.height = (height + 40) * ratio;
    canvas.style.height = `${width + 40}px`;
    canvas.style.width = `${height + 40}px`;
    var context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.rect(0, 0, width + 40, height + 40);
    context.fillStyle = '#fff';
    context.fill();
    context.drawImage(image, 20, 20);
    var url = canvas.toDataURL('image/png');
    var a = document.createElement('a');
    a.download = chartName + '-' + rootName + '.png';
    a.href = url;
    a.click();
    return;
  };
};

export const downloadImpByChart = (
  svg: SVGAElement,
  chartName: string,
  rootName: string,
  zoomClassName = '',
) => {
  //得到svg的真实大小
  let box = (document.querySelector('svg') as any as SVGAElement).getBBox(),
    x = box.x,
    y = box.y,
    width = box.width,
    height = box.height;
  if (zoomClassName) {
    //查找zoomObj
    var zoomObj = svg.getElementsByClassName(zoomClassName.replace(/\./g, ''))[0];
    if (!zoomObj) {
      return false;
    }
    /*------这里是处理svg缩放的--------*/
    var transformMath = zoomObj.getAttribute('transform')!,
      scaleMath = zoomObj.getAttribute('transform')!;
    if (transformMath || scaleMath) {
      var transformObj = transformMath.match(/translate\(([^,]*),([^,)]*)\)/)!,
        scaleObj = scaleMath.match(/scale\((.*)\)/)!;
      if (transformObj || scaleObj) {
        //匹配到缩放
        var translateX = transformObj[1] as any as number,
          translateY = transformObj[2] as any as number,
          scale = scaleObj[1] as any as number;
        x = (x - translateX) / scale;
        y = (y - translateY) / scale;
        width = width / scale;
        height = height / scale;
      }
    }
  }
  //克隆svg
  var node = svg.cloneNode(true) as SVGAElement;
  //重新设置svg的width,height,viewbox
  node.setAttribute('width', String(width * 2));
  node.setAttribute('height', String(height * 2));
  node.setAttribute('viewBox', [x, y, width, height] as any);
  if (zoomClassName) {
    var zoomObj = node.getElementsByClassName(zoomClassName.replace(/\./g, ''))[0];
    /*-------------清楚缩放元素的缩放-------------*/
    zoomObj.setAttribute('transform', 'translate(0,0) scale(1)');
  }
  downloadSvgFn(node, width, height, chartName, rootName);
};
