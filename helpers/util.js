/**
	Utilities
*/


exports.get_data = function (reqd, optional, body) {
    var i = reqd.length,
        ret = {},
        temp;
    while (i--) {
        if (!body[temp = reqd[i]] || body[temp] instanceof Array)
            return temp + ' is missing';
        ret[temp] = body[temp];
    }
	i = optional.length;
    while (i--)
        if (body[temp = optional[i]])
			ret[temp] = body[temp];
    return ret;
};

exports.random_string = function (i) {
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		str = '',
		l = i || 32;

    while (l--)
        str += possible.charAt(~~(Math.random() * 62));

    return str;
};

exports.pad = function (num, size) {
    return ('000000000' + num).substr(-(size || 2));
};

exports.extract_files = function (files, name, next) {
    if (files[name])
        return (files[name] instanceof Array) ? files[name] : [files[name]];
    if (next) {
        next(name + ' is missing');
		return false;
	}
    return [];
};

exports.to_title_case = function (str) {
	if (str)
		return str.replace(/\w\S*/g, function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	return false;
};

exports.current_date = function () {
	var d = new Date();
	return [d.getFullYear(), this.pad(d.getMonth() + 1), this.pad(d.getDate())].join('-');
};

exports.cleanString = function (s) {
	return s.match(/\S{1,30}/g).join(' ');
};
