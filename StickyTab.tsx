import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
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
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import React, { FC, useState } from "react";
import { Placeholder } from "./Placeholder";
import { TABS_GAP, INNER_PADDING, CONTAINER_BORDER_WIDTH } from "./constants";
import { TabItem, TabItemBackgroundProps, TabItemProps } from "./TabItem";

type Props = Pick<
  TabItemProps,
  | "gradientEnabled"
  | "tabHeight"
  | "horizontalResistance"
  | "verticalResistance"
> &
  TabItemBackgroundProps & {
    /**
     * the default value is container / number of tabs + padding in between. If you want to set a fixed width, you can use this prop
     */
    tabWidth?: TabItemProps["tabWidth"];
    values: string[];
    renderText: (value: string, index: number) => React.ReactNode;
    containerWidth: number;
    containerStyle?: StyleProp<ViewStyle>;
    placeholderBackgroundColor: string;
    innerPadding?: number;
    tabHeadBorderRadius?: number;
    tabTailBorderRadius?: number;
    containerBorderRadius?: number;
    containerBorderWidth?: number;
    backgroundColor: string;
  };

export const StickyTab: FC<Props> = (props) => {
  const innerPadding = props.innerPadding ?? INNER_PADDING;
  const tabNum = props.values.length;
  const tabWidth =
    props.tabWidth ??
    (props.containerWidth - props.innerPadding * 2) / tabNum - TABS_GAP;
  const containerBorderWidth =
    props.containerBorderWidth ?? CONTAINER_BORDER_WIDTH;
  const MAX_DRAG =
    props.containerWidth -
    2 * innerPadding -
    tabWidth -
    containerBorderWidth * 2;
  const CONTAINER_HEIGHT =
    props.tabHeight + 2 * innerPadding + 2 * containerBorderWidth;
  const MAX_WIDTH = tabWidth * props.horizontalResistance;

  const tabHeadBorderRadius = props.tabHeadBorderRadius ?? props.tabHeight / 2;
  const tabTailBorderRadius = props.tabTailBorderRadius ?? props.tabHeight / 2;
  const containerBorderRadius =
    props.containerBorderRadius ??
    (tabHeadBorderRadius + tabTailBorderRadius) / 2 + innerPadding;

  const STEP = MAX_DRAG / (tabNum - 1);
  const snapPoints = new Array(tabNum).fill(0).map((_, i) => STEP * i);

  const sticked = useSharedValue(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const position = useSharedValue(0);
  const sticking = useDerivedValue(() => withSpring(sticked.value ? 1 : 0));
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
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
  const hapticEndStretch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const hapticStartStretch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Cancel animation but keep the current value
      const prevTranslation = translateX.value;
      cancelAnimation(translateX);
      translateX.value = prevTranslation;

      isRunningId.value = Date.now();
      runOnJS(hapticStartStretch)();
    })
    .onChange(({ translationX, translationY }) => {
      translateX.value = translationX + offsetX.value;
      translateY.value = translationY;
      if (Math.abs(translationX) > MAX_WIDTH && sticked.value) {
        sticked.value = false;
        runOnJS(hapticEndStretch)();
      }
    })
    .onEnd(({ velocityX: velocity }) => {
      const dest = snapPoint(
        translateX.value + position.value,
        velocity,
        snapPoints
      );
      translateY.value = withSpring(0);
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
    <View
      style={[
        {
          width: props.containerWidth + containerBorderWidth,
          height: CONTAINER_HEIGHT + containerBorderWidth,
        },
        props.containerStyle,
      ]}
    >
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={
          props.gradientEnabled === false
            ? [props.backgroundColor]
            : props.colors
        }
        style={{
          width: props.containerWidth + containerBorderWidth,
          height: CONTAINER_HEIGHT + containerBorderWidth,
          borderRadius: containerBorderRadius + containerBorderWidth,
          padding: containerBorderWidth,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: props.backgroundColor,
            borderRadius: containerBorderRadius,
            overflow: "hidden",
          }}
        >
          <TabItem
            verticalResistance={props.verticalResistance}
            horizontalResistance={props.horizontalResistance}
            headBorderRadius={tabHeadBorderRadius}
            tailBorderRadius={tabTailBorderRadius}
            progress={progress}
            padding={innerPadding}
            translateX={tabTranslation}
            translateY={translateY}
            panGesture={panGesture}
            tabWidth={tabWidth}
            tabHeight={props.tabHeight}
            gradientEnabled={props.gradientEnabled}
            backgroundColor={
              props.gradientEnabled === false && props.backgroundColor
            }
            colors={props.gradientEnabled && props.colors}
          />
          {props.values.map((value, index) => (
            <Placeholder
              key={value}
              borderRadius={containerBorderRadius - innerPadding}
              containerPadding={innerPadding}
              backgroundColor={props.placeholderBackgroundColor}
              translateX={STEP}
              renderText={() => props.renderText(value, index)}
              tabHeight={props.tabHeight}
              tabWidth={tabWidth}
              tabTranslation={tabTranslation}
              index={index}
              onPress={(translation) => {
                position.value = withTiming(translation, {
                  easing: Easing.inOut(Easing.ease),
                });
                hapticStartStretch();
                translateX.value = 0;
                offsetX.value = 0;
                sticked.value = true;
                setSelectedIndex(index);
              }}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};
