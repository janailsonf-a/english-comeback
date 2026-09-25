import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLearningStorage } from "../persistence/learningStorage";

export const localProgressStorage = createLearningStorage(AsyncStorage);
