import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolate,
  cancelAnimation,
  interpolate,
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { snapPoint } from "react-native-redash";
import { Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useState } from "react";
import {
  CONTAINER_WIDTH,
  MAX_WIDTH,
  SIZE_WIDTH,
  StickyTab,
  TAB_PADDING,
  CONTAINER_BORDER_WIDTH,
  CONTAINER_HEIGHT,
  CONTAINER_PADDING,
  CONTAINER_BORDER_RADIUS,
  SIZE_HEIGHT,
} from "./StickyTab";
import { Placeholder } from "./Placeholder";

const MAX_DRAG =
  CONTAINER_WIDTH - 2 * TAB_PADDING - SIZE_WIDTH - CONTAINER_BORDER_WIDTH * 2;
const TAB_NUM = 3; // Divide the width of the container by this number
const STEP = MAX_DRAG / (TAB_NUM - 1);
const snapPoints = new Array(TAB_NUM).fill(0).map((_, i) => STEP * i);

export default function App() {
  const sticked = useSharedValue(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const position = useSharedValue(0);
  const sticking = useDerivedValue(() => withSpring(sticked.value ? 1 : 0));
  const translateX = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const isRunningId = useSharedValue<null | number>(null);
  const tabTranslation = useDerivedValue(
    () =>
      sticked.value
        ? position.value
        : position.value + (1 - sticking.value) * translateX.value,
    [sticked.value, position.value, translateX.value]
  );
  const progress = useDerivedValue(
    () =>
      sticking.value *
      interpolate(
        translateX.value,
        [-MAX_WIDTH, 0, MAX_WIDTH],
        [-1, 0, 1],
        Extrapolate.CLAMP
      )
  );
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Cancel animation but keep the current value
      const prevTranslation = translateX.value;
      cancelAnimation(translateX);
      translateX.value = prevTranslation;

      isRunningId.value = Date.now();
    })
    .onChange(({ translationX }) => {
      translateX.value = translationX + offsetX.value;
      if (Math.abs(translationX) > MAX_WIDTH) {
        sticked.value = false;
      }
    })
    .onEnd(({ velocityX: velocity }) => {
      const dest = snapPoint(
        translateX.value + position.value,
        velocity,
        snapPoints
      );
      const runningId = isRunningId.value;

      const finalDest = sticked.value ? 0 : dest - position.value;
      translateX.value = withTiming(
        finalDest,
        { easing: Easing.inOut(Easing.ease) },
        () => {
          const cancelled = runningId !== isRunningId.value;
          if (!cancelled) {
            position.value = sticked.value ? position.value : dest;
            translateX.value = 0;
            sticked.value = true;
            isRunningId.value = null;
            offsetX.value = 0;
            runOnJS(setSelectedIndex)(Math.round(dest / STEP));
          } else {
            offsetX.value = translateX.value;
          }
        }
      );
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={styles.container}>
        <View
          style={{
            width: CONTAINER_WIDTH,
            height: CONTAINER_HEIGHT,
            borderWidth: CONTAINER_BORDER_WIDTH,
            borderColor: "#45A6E5",
            borderRadius: CONTAINER_BORDER_RADIUS,
            marginHorizontal: CONTAINER_PADDING,
            overflow: "hidden",
          }}
        >
          <StickyTab
            progress={progress}
            translateX={tabTranslation}
            panGesture={panGesture}
          />
          {new Array(TAB_NUM).fill(0).map((_, i) => (
            <Placeholder
              key={i}
              translateX={STEP}
              tabTranslation={tabTranslation}
              index={i}
              onPress={(translation) => {
                position.value = withTiming(translation, {
                  easing: Easing.inOut(Easing.ease),
                });
                translateX.value = 0;
                offsetX.value = 0;
                sticked.value = true;
                setSelectedIndex(i);
              }}
            />
          ))}
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
