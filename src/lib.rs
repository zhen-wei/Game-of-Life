mod utils;
pub mod universe;
use wasm_bindgen::prelude::*;


#[wasm_bindgen]
extern {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(start)]
fn _start() {
    utils::set_panic_hook();
}




