import React from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  SIZE_WIDTH,
  SIZE_HEIGHT,
  CONTAINER_BORDER_RADIUS,
  TAB_PADDING,
} from "./StickyTab";
import Animated, {
  Extrapolate,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

type PlaceholderProps = {
  translateX: number;
  tabTranslation: SharedValue<number>;
  index: number;
  onPress?: (translateX: number) => void;
};

const styles = StyleSheet.create({
  container: {},
});

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export const Placeholder: React.FC<PlaceholderProps> = ({
  translateX,
  tabTranslation,
  index,
  onPress,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      tabTranslation.value,
      [(index - 1) * translateX, index * translateX, (index + 1) * translateX],
      [0.15, 0, 0.15],
      Extrapolate.CLAMP
    );

    return { opacity };
  });
  return (
    <AnimatedTouchable
      onPress={onPress?.bind("", translateX * index)}
      style={[
        {
          backgroundColor: "#45A6E5",
          zIndex: -1,
          position: "absolute",
          width: SIZE_WIDTH,
          height: SIZE_HEIGHT,
          borderRadius: CONTAINER_BORDER_RADIUS - TAB_PADDING,
          top: TAB_PADDING,
          start: TAB_PADDING,
          transform: [{ translateX: translateX * index }],
        },
        animatedStyle,
      ]}
    />
  );
};
