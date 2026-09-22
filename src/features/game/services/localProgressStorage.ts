import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNarrativeStorage } from "../persistence/narrativeStorage";

export const localProgressStorage = createNarrativeStorage(AsyncStorage);
