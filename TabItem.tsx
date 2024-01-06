import React from "react";
import Animated, {
  Extrapolate,
  SharedValue,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Defs, G, LinearGradient, Path, Stop } from "react-native-svg";
import {
  addCurve,
  addLine,
  addQuadraticCurve,
  createPath,
  serialize,
} from "react-native-redash";
import { GestureDetector, PanGesture } from "react-native-gesture-handler";
import { clamp } from "./utils";

type GradientProps = { gradientEnabled: true; colors: string[] };
type PlainBackgroundProps = {
  gradientEnabled: false;
  backgroundColor: string;
};

export type TabItemBackgroundProps = GradientProps | PlainBackgroundProps;

export type TabItemProps = {
  progress: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  panGesture: PanGesture;
  tabWidth: number;
  tabHeight: number;
  padding: number;
  headBorderRadius: number;
  tailBorderRadius: number;
  /**
   * The vertical resistance of the tab. The the lesser the value, the more the tab will shrink vertically. The value must be between 0 and 1.
   */
  verticalResistance: number;
  /**
   * The horizontal resistance of the tab. The the greater the value, the more the tab will stretch horizontally. The value must be greater than 1.
   */
  horizontalResistance: number;
} & TabItemBackgroundProps;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedGroup = Animated.createAnimatedComponent(G);

export const TabItem: React.FC<TabItemProps> = (props) => {
  const { verticalResistance, horizontalResistance } = props;
  const vFactor = clamp(verticalResistance, 0, 1);
  const hFactor = Math.max(horizontalResistance, 1);
  const { progress, translateX, translateY, panGesture, tabWidth, tabHeight } =
    props;

  const TAIL_CONTROL_DIFF_POINT = {
    x: tabWidth / 7,
    y: 0,
  };
  const HEAD_CONTROL_DIFF_POINT = {
    x: tabWidth / 3,
    y: 0,
  };

  const animatedProps = useAnimatedProps(() => {
    const clampedVFactor = clamp(vFactor, 20 / tabHeight, 1);
    const normalizedVFactor = (1 - clampedVFactor) / 2;
    const factor = {
      x: interpolate(progress.value, [-1, 0, 1], [hFactor, 1, hFactor]),
      y: interpolate(
        progress.value,
        [-1, 0, 1],
        [normalizedVFactor, 0, normalizedVFactor]
      ),
    };
    const maxTranslateY = (tabHeight * normalizedVFactor) / 2;
    const clampedTranslateY = clamp(
      translateY.value,
      -maxTranslateY,
      maxTranslateY
    );
    const minHeight = tabHeight * (1 - 2 * factor.y);
    const progressY = interpolate(
      clampedTranslateY,
      [-maxTranslateY, 0, maxTranslateY],
      [-1, 0, 1]
    );

    const p1 =
      progress.value >= 0
        ? { x: 0, y: 0 }
        : {
            x: -(factor.x - 1) * tabWidth,
            y: clamp(
              tabHeight * factor.y + translateY.value,
              0,
              tabHeight - minHeight
            ),
          };
    const p2 =
      progress.value >= 0
        ? {
            x: tabWidth * factor.x,
            y: clamp(
              factor.y * tabHeight + translateY.value,
              0,
              tabHeight - minHeight
            ),
          }
        : { x: tabWidth, y: 0 };
    const p3 =
      progress.value >= 0
        ? {
            x: tabWidth * factor.x,
            y: clamp(
              tabHeight * (1 - factor.y) + translateY.value,
              minHeight,
              tabHeight
            ),
          }
        : { x: tabWidth, y: tabHeight };
    const p4 =
      progress.value >= 0
        ? { x: 0, y: tabHeight }
        : {
            x: -(factor.x - 1) * tabWidth,
            y: clamp(
              tabHeight * (1 - factor.y) + translateY.value,
              minHeight,
              tabHeight
            ),
          };

    const path = createPath({ x: p1.x + props.tailBorderRadius, y: p1.y });
    const headControlX = interpolate(
      progress.value,
      [-1, 0, 1],
      [TAIL_CONTROL_DIFF_POINT.x, 0, HEAD_CONTROL_DIFF_POINT.x]
    );
    const topFactorX = interpolate(progressY, [-1, 0, 1], [1.3, 1, 1.5]);
    const bottomFactorX = interpolate(progressY, [-1, 0, 1], [1.5, 1, 1.3]);
    const tailControlX = interpolate(
      progress.value,
      [-1, 0, 1],
      [HEAD_CONTROL_DIFF_POINT.x, 0, TAIL_CONTROL_DIFF_POINT.x]
    );
    // const borderRadiusFactor = Math.pow(1 + sigmoid(1 - normalizedVFactor), 1);
    // const headBorderRadius = interpolate(
    //   progress.value,
    //   [-1, 0, 1],
    //   [
    //     props.headBorderRadius,
    //     props.headBorderRadius,
    //     props.headBorderRadius / (hFactor * borderRadiusFactor),
    //   ],
    //   Extrapolate.CLAMP
    // );
    // const tailBorderRadius = interpolate(
    //   progress.value,
    //   [-1, 0, 1],
    //   [
    //     props.headBorderRadius / (hFactor * borderRadiusFactor),
    //     props.headBorderRadius,
    //     props.headBorderRadius,
    //   ],
    //   Extrapolate.CLAMP
    // );
    const headBorderRadius = interpolate(
      progress.value,
      [-1, 0, 1],
      [props.headBorderRadius, props.headBorderRadius, minHeight / 2],
      Extrapolate.CLAMP
    );
    const tailBorderRadius = interpolate(
      progress.value,
      [-1, 0, 1],
      [minHeight / 2, props.headBorderRadius, props.headBorderRadius],
      Extrapolate.CLAMP
    );

    addCurve(path, {
      c1: { x: p1.x + tailBorderRadius + tailControlX * topFactorX, y: p1.y },
      c2: {
        x: p2.x - headBorderRadius - headControlX * bottomFactorX,
        y: p2.y,
      },
      to: {
        x: p2.x - headBorderRadius,
        y: p2.y,
      },
    });
    addQuadraticCurve(
      path,
      { x: p2.x, y: p2.y },
      { x: p2.x, y: p2.y + headBorderRadius }
    );
    addLine(path, { x: p3.x, y: p3.y - headBorderRadius });
    addQuadraticCurve(
      path,
      { x: p3.x, y: p3.y },
      { x: p3.x - headBorderRadius, y: p3.y }
    );
    addCurve(path, {
      c1: {
        x: p3.x - headBorderRadius - headControlX * bottomFactorX,
        y: p3.y,
      },
      c2: {
        x: p4.x + tailBorderRadius + tailControlX * topFactorX,
        y: p4.y,
      },
      to: {
        x: p4.x + tailBorderRadius,
        y: p4.y,
      },
    });
    addQuadraticCurve(
      path,
      { x: p4.x, y: p4.y },
      { x: p4.x, y: p4.y - tailBorderRadius }
    );
    addLine(path, { x: p1.x, y: p1.y + tailBorderRadius });
    addQuadraticCurve(
      path,
      { x: p1.x, y: p1.y },
      { x: p1.x + tailBorderRadius, y: p1.y }
    );
    return {
      d: serialize(path),
    };
  }, [progress.value, translateX.value]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  return (
    <GestureDetector gesture={panGesture}>
      <Svg
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <Defs>
          {props.gradientEnabled && (
            <LinearGradient id={`gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
              {props.colors.map((color, index) => {
                return (
                  <Stop
                    key={index}
                    offset={`${(index * 100) / props.colors.length}%`}
                    stopColor={color}
                  />
                );
              })}
            </LinearGradient>
          )}
        </Defs>
        <AnimatedGroup style={animatedStyle}>
          <AnimatedPath
            translateY={props.padding}
            fill={
              props.gradientEnabled === false
                ? props.backgroundColor
                : `url(#gradient)`
            }
            translateX={props.padding}
            animatedProps={animatedProps}
          />
        </AnimatedGroup>
      </Svg>
    </GestureDetector>
  );
};
