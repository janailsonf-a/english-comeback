import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMissionStorage } from "../persistence/missionStorage";

export const localProgressStorage = createMissionStorage(AsyncStorage);
