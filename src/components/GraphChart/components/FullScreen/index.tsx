import { Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import { addEvent } from '../../utils';

declare const document: Document & {
  fullScreen: boolean;
  fullscreenElement: Element;
  webkitFullscreenElement: Element;
  webkitIsFullScreen: boolean;
  webkitCancelFullScreen: () => void;
  mozFullScreen: boolean;
  mozFullScreenElement: Element;
  mozCancelFullScreen: () => void;
  msExitFullscreen: () => void;
};

const FullScreen: React.FC<any> = (props) => {
  const showFullScreenBtn: boolean = window.navigator.userAgent.indexOf('MSIE') < 0;
  const [fullScreen, setFullScreen] = useState<boolean>(false);
  const main = document.body as any;

  useEffect(() => {
    const callback = () => {
      const isFullScreen =
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.fullScreen ||
        document.mozFullScreen ||
        document.webkitIsFullScreen;
      setFullScreen(!!isFullScreen);
    };
    addEvent(document, 'fullscreenchange', callback);
    addEvent(document, 'mozfullscreenchange', callback);
    addEvent(document, 'webkitfullscreenchange', callback);
    addEvent(document, 'msfullscreenchange', callback);
  }, []);

  const handleFullScreen = () => {
    if (fullScreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } else {
      if (main.requestFullscreen) {
        main.requestFullscreen();
      } else if (main.mozRequestFullScreen) {
        main.mozRequestFullScreen();
      } else if (main.webkitRequestFullScreen) {
        main.webkitRequestFullScreen();
      } else if (main.msRequestFullscreen) {
        main.msRequestFullscreen();
      }
    }
  };

  const fullScreenStyle = {
    fontSize: 16,
    cursor: 'pointer',
    color: '#000',
  };

  if (!showFullScreenBtn) return null;

  return (
    <div className={props.className} style={fullScreenStyle}>
      <Tooltip placement="left" title={fullScreen ? '退出全屏' : '全屏'}>
        {
          <svg
            onClick={handleFullScreen}
            width="16px"
            height="16px"
            viewBox="0 0 16 16"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>全屏</title>
            <g id="1016版本" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
              <g
                id="公司总部业务分工查询-图谱-悬停浮层"
                transform="translate(-1548.000000, -800.000000)"
              >
                <g id="编组-4" transform="translate(1544.000000, 796.000000)">
                  <g id="1.icon/24/全屏" transform="translate(4.000000, 4.000000)">
                    <rect id="矩形" x="0" y="0" width="16" height="16"></rect>
                    <g
                      id="编组"
                      transform="translate(3.533333, 3.533333)"
                      fill="#5B6371"
                      fillRule="nonzero"
                    >
                      <path
                        d="M8.93333333,0 L8.93333333,2.46666667 L8,2.46666667 L8,0.933333333 L6.46666667,0.933333333 L6.46666667,0 L8.93333333,0 Z M8.93333333,6.46666667 L8.93333333,8.93333333 L6.46666667,8.93333333 L6.46666667,8 L8,8 L8,6.46666667 L8.93333333,6.46666667 Z M0.933333333,6.46666667 L0.933333333,8 L2.46666667,8 L2.46666667,8.93333333 L0,8.93333333 L0,8.46666667 L0,6.46666667 L0.933333333,6.46666667 Z M2.46666667,0 L2.46666667,0.933333333 L0.933333333,0.933333333 L0.933333333,2.46666667 L0,2.46666667 L0,0 L0.466666667,0 L2.46666667,0 Z"
                        id="形状结合"
                      ></path>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>
        }
      </Tooltip>
    </div>
  );
};

export default FullScreen;
