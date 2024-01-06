import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { StickyTab } from "./StickyTab";
import {
  BACKGROUND_COLOR,
  GRADIENT_COLORS,
  INNER_PADDING,
  TEXT_COLOR,
} from "./constants";
import { GestureHandlerRootView } from "react-native-gesture-handler";

type AppProps = {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
});

const { width } = Dimensions.get("window");

const CONTAINER_PADDING = 20;
const CONTAINER_WIDTH = width - 2 * CONTAINER_PADDING;

const App: React.FC<AppProps> = ({}) => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StickyTab
        tabHeight={40}
        innerPadding={INNER_PADDING}
        containerWidth={CONTAINER_WIDTH}
        placeholderBackgroundColor={GRADIENT_COLORS[1]}
        containerStyle={{ marginHorizontal: CONTAINER_PADDING }}
        verticalResistance={0.8}
        backgroundColor={BACKGROUND_COLOR}
        horizontalResistance={1.5}
        gradientEnabled
        colors={GRADIENT_COLORS}
        values={["Tab 1", "Tab 2", "Tab 3", "Tab 4"]}
        renderText={(value) => (
          <Text style={{ fontSize: 22, color: TEXT_COLOR, fontWeight: "700" }}>
            {value}
          </Text>
        )}
      />
    </GestureHandlerRootView>
  );
};

export default App;
