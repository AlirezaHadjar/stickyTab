import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Circle, G, Path } from "react-native-svg";
import {
  addCurve,
  addLine,
  addQuadraticCurve,
  createPath,
  mix,
  serialize,
} from "react-native-redash";
import { GestureDetector, PanGesture } from "react-native-gesture-handler";

type StickyTabProps = {
  progress: SharedValue<number>;
  translateX: SharedValue<number>;
  panGesture: PanGesture;
};

const styles = StyleSheet.create({
  container: {},
});

const { width } = Dimensions.get("window");

export const SIZE_WIDTH = 120;
export const SIZE_HEIGHT = 120;

export const CONTAINER_PADDING = 10;
export const TAB_PADDING = 10;

export const CONTAINER_WIDTH = width - 2 * CONTAINER_PADDING;
export const CONTAINER_HEIGHT = SIZE_HEIGHT + 2 * TAB_PADDING;

const H_FACTOR = 1.5;
const V_FACTOR = 0.1;

const HEAD_BORDER_RADIUS = 20;
const TAIL_BORDER_RADIUS = 20;

export const CONTAINER_BORDER_WIDTH = 3;

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
const AnimatedGroup = Animated.createAnimatedComponent(G);

export const StickyTab: React.FC<StickyTabProps> = ({
  progress,
  translateX,
  panGesture,
}) => {
  const animatedProps = useAnimatedProps(() => {
    const factor = {
      x: interpolate(progress.value, [-1, 0, 1], [H_FACTOR, 1, H_FACTOR]),
      y: interpolate(progress.value, [-1, 0, 1], [V_FACTOR, 0, V_FACTOR]),
    };

    const p1 =
      progress.value >= 0
        ? { x: 0, y: 0 }
        : { x: -(factor.x - 1) * SIZE_WIDTH, y: SIZE_HEIGHT * factor.y };
    const p2 =
      progress.value >= 0
        ? { x: SIZE_WIDTH * factor.x, y: factor.y * SIZE_HEIGHT }
        : { x: SIZE_WIDTH, y: 0 };
    const p3 =
      progress.value >= 0
        ? { x: SIZE_WIDTH * factor.x, y: SIZE_HEIGHT * (1 - factor.y) }
        : { x: SIZE_WIDTH, y: SIZE_HEIGHT };
    const p4 =
      progress.value >= 0
        ? { x: 0, y: SIZE_HEIGHT }
        : { x: -(factor.x - 1) * SIZE_WIDTH, y: SIZE_HEIGHT * (1 - factor.y) };

    const path = createPath({ x: p1.x + TAIL_BORDER_RADIUS, y: p1.y });

    addCurve(path, {
      c1: { x: p1.x + TAIL_BORDER_RADIUS + TAIL_CONTROL_DIFF_POINT.x, y: p1.y },
      c2: {
        x: p2.x - HEAD_BORDER_RADIUS - HEAD_CONTROL_DIFF_POINT.x,
        y: p2.y,
      },
      to: {
        x: p2.x - HEAD_BORDER_RADIUS,
        y: p2.y,
      },
    });
    addQuadraticCurve(
      path,
      { x: p2.x, y: p2.y },
      { x: p2.x, y: p2.y + HEAD_BORDER_RADIUS }
    );
    addLine(path, { x: p3.x, y: p3.y - HEAD_BORDER_RADIUS });
    addQuadraticCurve(
      path,
      { x: p3.x, y: p3.y },
      { x: p3.x - HEAD_BORDER_RADIUS, y: p3.y }
    );
    addCurve(path, {
      c1: {
        x: p3.x - HEAD_BORDER_RADIUS - HEAD_CONTROL_DIFF_POINT.x,
        y: p3.y,
      },
      c2: {
        x: p4.x + TAIL_BORDER_RADIUS + TAIL_CONTROL_DIFF_POINT.x,
        y: p4.y,
      },
      to: {
        x: p4.x + TAIL_BORDER_RADIUS,
        y: p4.y,
      },
    });
    addQuadraticCurve(
      path,
      { x: p4.x, y: p4.y },
      { x: p4.x, y: p4.y - TAIL_BORDER_RADIUS }
    );
    addLine(path, { x: p1.x, y: p1.y + TAIL_BORDER_RADIUS });
    addQuadraticCurve(
      path,
      { x: p1.x, y: p1.y },
      { x: p1.x + HEAD_BORDER_RADIUS, y: p1.y }
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
    <View
      style={{
        width: CONTAINER_WIDTH,
        height: CONTAINER_HEIGHT,
        borderWidth: CONTAINER_BORDER_WIDTH,
        borderColor: "#45A6E5",
        borderRadius: (HEAD_BORDER_RADIUS + TAIL_BORDER_RADIUS) / 2,
        marginHorizontal: CONTAINER_PADDING,
        overflow: "hidden",
      }}
    >
      <GestureDetector gesture={panGesture}>
        <Svg
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <AnimatedGroup style={animatedStyle}>
            <AnimatedPath
              translateY={TAB_PADDING - CONTAINER_BORDER_WIDTH}
              translateX={TAB_PADDING}
              animatedProps={animatedProps}
              fill={"#45A6E5"}
            />
          </AnimatedGroup>
        </Svg>
      </GestureDetector>
    </View>
  );
};
