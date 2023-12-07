import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import {
  addCurve,
  addLine,
  addQuadraticCurve,
  createPath,
  mix,
  serialize,
} from "react-native-redash";

type StickyTabProps = {
  progress: SharedValue<number>;
};

const styles = StyleSheet.create({
  container: {},
});

export const SIZE_WIDTH = 100;
export const SIZE_HEIGHT = 60;

const H_FACTOR = 1.25;
const V_FACTOR = 0.1;

const HEAD_BORDER = 20;
const TAIL_BORDER = 20;

const TAIL_CONTROL_DIFF_POINT = {
  x: SIZE_WIDTH / 7,
  y: 0,
};
const HEAD_CONTROL_DIFF_POINT = {
  x: SIZE_WIDTH / 3,
  y: 0,
};
export const MAX_WIDTH = SIZE_WIDTH * H_FACTOR;
//TODO: Reduce border radius on stretch
const AnimatedSVG = Animated.createAnimatedComponent(Svg);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const StickyTab: React.FC<StickyTabProps> = ({ progress }) => {
  const animatedProps = useAnimatedProps(() => {
    const factor = {
      x: mix(progress.value, 1, H_FACTOR),
      y: mix(progress.value, 0, V_FACTOR),
    };
    const p1 = { x: 0, y: 0 };
    const p2 = { x: SIZE_WIDTH * factor.x, y: factor.y * SIZE_HEIGHT };
    const p3 = { x: SIZE_WIDTH * factor.x, y: SIZE_HEIGHT * (1 - factor.y) };
    const p4 = { x: 0, y: SIZE_HEIGHT };

    const path = createPath({ x: p1.x + TAIL_BORDER, y: p1.y });

    addCurve(path, {
      c1: { x: p1.x + TAIL_BORDER + TAIL_CONTROL_DIFF_POINT.x, y: p1.y },
      c2: {
        x: p2.x - HEAD_BORDER - HEAD_CONTROL_DIFF_POINT.x,
        y: p2.y,
      },
      to: {
        x: p2.x - HEAD_BORDER,
        y: p2.y,
      },
    });
    addQuadraticCurve(
      path,
      { x: p2.x, y: p2.y },
      { x: p2.x, y: p2.y + HEAD_BORDER }
    );
    addLine(path, { x: p3.x, y: p3.y - HEAD_BORDER });
    addQuadraticCurve(
      path,
      { x: p3.x, y: p3.y },
      { x: p3.x - HEAD_BORDER, y: p3.y }
    );
    addCurve(path, {
      c1: {
        x: p3.x - HEAD_BORDER - HEAD_CONTROL_DIFF_POINT.x,
        y: p3.y,
      },
      c2: {
        x: p4.x + TAIL_BORDER + TAIL_CONTROL_DIFF_POINT.x,
        y: p4.y,
      },
      to: {
        x: p4.x + TAIL_BORDER,
        y: p4.y,
      },
    });
    addQuadraticCurve(
      path,
      { x: p4.x, y: p4.y },
      { x: p4.x, y: p4.y - TAIL_BORDER }
    );
    addLine(path, { x: p1.x, y: p1.y + TAIL_BORDER });
    addQuadraticCurve(
      path,
      { x: p1.x, y: p1.y },
      { x: p1.x + HEAD_BORDER, y: p1.y }
    );

    return {
      d: serialize(path),
    };
  });

  const container = useAnimatedStyle(() => {
    const factor = {
      x: mix(progress.value, 1, H_FACTOR),
      y: mix(progress.value, 0, V_FACTOR),
    };
    return {
      width: SIZE_WIDTH * factor.x + 30,
      height: SIZE_HEIGHT + 30,
    };
  });
  return (
    <AnimatedSVG style={container}>
      <AnimatedPath animatedProps={animatedProps} fill={"#45A6E5"} />
    </AnimatedSVG>
  );
};
