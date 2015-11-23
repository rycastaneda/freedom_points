
var config = {
    production: {
        backend_url: 'api.music.tm'
    },
    development: {
        backend_url: 'http://10.10.2.24',
        cloudfront: 'http://d1gyn9a1opa35u.cloudfront.net/'
    },
};

window.Polymer.config = config[window.Polymer.env || 'development'];

window.Polymer.getHeaders = function () {
    return {
        'Access-Token': Cookies.get('Access-Token'),
        mida: Cookies.get('mida')
    };
};

