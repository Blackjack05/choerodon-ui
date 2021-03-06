import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isCssAnimationSupported from '../_util/isCssAnimationSupported';
import omit from 'omit.js';
import Animate from '../rc-components/animate';
import Progress from '../progress/progress';

export type SpinIndicator = React.ReactElement<any>;

export interface SpinProps {
  prefixCls?: string;
  className?: string;
  spinning?: boolean;
  style?: React.CSSProperties;
  size?: 'small' | 'default' | 'large';
  tip?: string;
  delay?: number;
  wrapperClassName?: string;
  indicator?: SpinIndicator;
}

export interface SpinState {
  spinning?: boolean;
  notCssAnimationSupported?: boolean;
}

export default class Spin extends React.Component<SpinProps, SpinState> {
  static defaultProps = {
    prefixCls: 'ant-spin',
    spinning: true,
    size: 'default',
    wrapperClassName: '',
  };

  static propTypes = {
    prefixCls: PropTypes.string,
    className: PropTypes.string,
    spinning: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'default', 'large']),
    wrapperClassName: PropTypes.string,
    indicator: PropTypes.node,
  };

  debounceTimeout: number;
  delayTimeout: number;

  constructor(props: SpinProps) {
    super(props);
    const spinning = props.spinning;
    this.state = {
      spinning,
    };
  }

  componentDidMount() {
    if (!isCssAnimationSupported()) {
      // Show text in IE9
      this.setState({
        notCssAnimationSupported: true,
      });
    }
  }

  componentWillUnmount() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    if (this.delayTimeout) {
      clearTimeout(this.delayTimeout);
    }
  }

  componentWillReceiveProps(nextProps: SpinProps) {
    const currentSpinning = this.props.spinning;
    const spinning = nextProps.spinning;
    const { delay } = this.props;

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    if (currentSpinning && !spinning) {
      this.debounceTimeout = window.setTimeout(() => this.setState({ spinning }), 200);
      if (this.delayTimeout) {
        clearTimeout(this.delayTimeout);
      }
    } else {
      if (spinning && delay && !isNaN(Number(delay))) {
        if (this.delayTimeout) {
          clearTimeout(this.delayTimeout);
        }
        this.delayTimeout = window.setTimeout(() => this.setState({ spinning }), delay);
      } else {
        this.setState({ spinning });
      }
    }
  }

  getIndicatorWidth(size?: string) {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 50;
      default :
        return 30;
    }
  }

  renderIndicator() {
    const { prefixCls, indicator, size } = this.props;
    const dotClassName = `${prefixCls}-dot`;
    if (React.isValidElement(indicator)) {
      return React.cloneElement((indicator as SpinIndicator), {
        className: classNames((indicator as SpinIndicator).props.className, dotClassName),
      });
    }
    return (
      <Progress width={this.getIndicatorWidth(size)} className={dotClassName} type="loading" />
    );
  }

  render() {
    const { className, size, prefixCls, tip, wrapperClassName, children, ...restProps } = this.props;
    const { spinning, notCssAnimationSupported } = this.state;

    const spinClassName = classNames(prefixCls, {
      [`${prefixCls}-sm`]: size === 'small',
      [`${prefixCls}-lg`]: size === 'large',
      [`${prefixCls}-spinning`]: spinning,
      [`${prefixCls}-show-text`]: !!tip || notCssAnimationSupported,
    }, className);

    // fix https://fb.me/react-unknown-prop
    const divProps = omit(restProps, [
      'spinning',
      'delay',
      'indicator',
    ]);

    const spinElement = (
      <div {...divProps} className={spinClassName} key="loading">
        {this.renderIndicator()}
        {tip ? <div className={`${prefixCls}-text`}>{tip}</div> : null}
      </div>
    );
    if (children) {
      let animateClassName = prefixCls + '-nested-loading';
      if (wrapperClassName) {
        animateClassName += ' ' + wrapperClassName;
      }
      const containerClassName = classNames({
        [`${prefixCls}-container`]: true,
        [`${prefixCls}-blur`]: spinning,
      });
      return (
        <Animate
          {...divProps}
          component="div"
          className={animateClassName}
          style={null}
          transitionName="fade"
        >
          {spinning && spinElement}
          <div className={containerClassName} key="container">
            {children}
          </div>
        </Animate>
      );
    }
    return spinElement;
  }
}
