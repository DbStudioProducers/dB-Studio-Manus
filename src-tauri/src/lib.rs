#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use tauri::Emitter;

#[derive(Debug, Serialize)]
struct DesktopStatus {
    app: &'static str,
    transport: &'static str,
    udp_port: u16,
    native_audio: &'static str,
}

#[tauri::command]
fn desktop_status() -> DesktopStatus {
    DesktopStatus {
        app: "dB Studio Desktop Server",
        transport: "DBAU/1",
        udp_port: 5004,
        native_audio: "audio-core ready; platform host build required",
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![desktop_status])
        .setup(|app| {
            if cfg!(debug_assertions) {
                let _ = app.handle().emit("native-ready", desktop_status());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running dB Studio desktop");
}
