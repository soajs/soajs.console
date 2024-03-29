/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

'use strict';

const axios = require('axios');

let bl = {
    "modelObj": null,
    "localConfig": null,

    "handleError": (soajs, errCode, err) => {
        if (err) {
            soajs.log.error(err.message);
        }
        return ({
            "code": errCode,
            "msg": bl.localConfig.errors[errCode] + ((err && errCode === 602) ? err.message : "")
        });
    },

    "listCollections": (soajs, inputmaskData, options, cb) => {
        if (!inputmaskData) {
            return cb(bl.handleError(soajs, 400, null));
        }
        bl.modelObj.listCollections(inputmaskData, (err, response) => {
            if (err) {
                return cb(bl.handleError(soajs, 602, err));
            }
            return cb(null, response);
        });
    },

    "deleteCollection": (soajs, inputmaskData, options, cb) => {
        if (!inputmaskData) {
            return cb(bl.handleError(soajs, 400, null));
        }
        bl.modelObj.deleteCollection(inputmaskData, (err, response) => {
            if (err) {
                return cb(bl.handleError(soajs, 602, err));
            }
            return cb(null, response);
        });
    },

    "deleteCollectionApi": (soajs, inputmaskData, options, cb) => {
        if (!inputmaskData) {
            return cb(bl.handleError(soajs, 400, null));
        }
        bl.modelObj.deleteCollectionApi(inputmaskData, (err, response) => {
            if (err) {
                return cb(bl.handleError(soajs, 602, err));
            }
            return cb(null, response);
        });
    },

    "updateCollection": (soajs, inputmaskData, options, cb) => {
        if (!inputmaskData) {
            return cb(bl.handleError(soajs, 400, null));
        }
        bl.modelObj.updateCollection(inputmaskData, (err, response) => {
            if (err) {
                return cb(bl.handleError(soajs, 602, err));
            }
            return cb(null, response);
        });
    },

    "updateCollectionApis": (soajs, inputmaskData, options, cb) => {
        if (!inputmaskData) {
            return cb(bl.handleError(soajs, 400, null));
        }
        bl.modelObj.updateCollectionApis(inputmaskData, (err, response) => {
            if (err) {
                return cb(bl.handleError(soajs, 602, err));
            }
            return cb(null, response);
        });
    },

    "updateCollectionApi": (soajs, inputmaskData, options, cb) => {
        if (!inputmaskData) {
            return cb(bl.handleError(soajs, 400, null));
        }
        bl.modelObj.updateCollectionApi(inputmaskData, (err, response) => {
            if (err) {
                return cb(bl.handleError(soajs, 602, err));
            }
            return cb(null, response);
        });
    },

    "addCollection": (soajs, inputmaskData, options, cb) => {
        if (!inputmaskData) {
            return cb(bl.handleError(soajs, 400, null));
        }

        inputmaskData.tenantId = soajs.tenant.id;
        inputmaskData.addedBy = soajs.urac._id;

        bl.modelObj.addCollection(inputmaskData, (err, response) => {
            if (err) {
                return cb(bl.handleError(soajs, 602, err));
            }
            return cb(null, response);
        });
    },

    "addCollectionApi": (soajs, inputmaskData, options, cb) => {
        if (!inputmaskData) {
            return cb(bl.handleError(soajs, 400, null));
        }
        bl.modelObj.addCollectionApi(inputmaskData, (err, response) => {
            if (err) {
                return cb(bl.handleError(soajs, 602, err));
            }
            return cb(null, response);
        });
    },


    "proxy": (soajs, inputmaskData, options, cb) => {
        axios(inputmaskData.config)
            .then((response) => {
                return cb(null, {
                    status: response.status,
                    data: response.data
                });
            })
            .catch((error) => {
                if (error.response) {
                    return cb(null, {
                        "status": error.response.status,
                        "error": error.message,
                        "data": error.response.data
                    });
                } else {
                    return cb(null, {
                        "error": error.message
                    });
                }
            });
    }

};

module.exports = bl;