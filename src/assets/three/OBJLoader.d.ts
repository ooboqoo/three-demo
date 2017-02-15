// Type definitions for three.js (OBJLoader.js)
// Project: https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/OBJLoader.js
// Definitions by: Gavin Wang <https://github.com/ooboqoo>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference types="three" />

declare namespace THREE {
    export class OBJLoader extends THREE.Loader {
        constructor();

        /**
         * load multiple CTM parts defined in JSON.
         * @param url(required)
         * @param callback(required)
         * @param parameters
         */
        loadParts(url: string, callback: () => any, parameters?: any): any;

        /**
         * Load CTMLoader compressed models
         * @param url(required)
         * @param callback(required)
         * @param parameters
         */
        load(url: string, callback: (geo: any) => any, parameters?: any): any;

        /**
         * create buffergeometry by ctm file.
         * @param file(required)
         * @param callback(required)
         */
        createModel(file: string, callback: () => any): any;

    }
}
