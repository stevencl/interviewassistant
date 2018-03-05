import { ConsoleLoggingListener, LocalStorage, SessionStorage } from "./common.browser/Exports";
import { Events, Storage } from "./common/Exports";

// Common.Storage.SetLocalStorage(new Common.Browser.LocalStorage());
// Common.Storage.SetSessionStorage(new Common.Browser.SessionStorage());
Events.Instance.AttachListener(new ConsoleLoggingListener());

export * from "./common/Exports";
export * from "./common.browser/Exports";
export * from "./sdk/speech/Exports";
export * from "./sdk/speech.browser/Exports";
