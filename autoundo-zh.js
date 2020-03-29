$(function () {
    var DELAY = 10;
    var SUMMARY = '自動回退[[Special:Contributions/$1|$1]]的所有編輯';

    var uid = null;

    var summary;
    var now = null;
    var timerId = null;
    var wgScript = mw.config.get('wgScript');

    var print = function (html) {
        $('#content').append($('<p>').html(html));
    };

    var getNewEdits = function (username, time) {
        return $.ajax({
            url: mw.util.wikiScript('api'),
            data: {
                format: 'json',
                action: 'query',
                list: 'usercontribs',
                uclimit: 'max',
                ucstart: new Date(time).toISOString(),
                ucuser: username,
                ucdir: 'newer'
            },
            dataType: 'json',
            type: 'POST',
        });
    };

    var pageLink = function (page, title) {
        return '<a target="_blank" href="' + wgScript + '?title=' + page + '">' + (title || page) + '</a>';
    };

    var undo = function (edits) {
        var callback = function (edit) {
            return function (data) {
                if (data.edit && data.edit.result === 'Success') {
                    print('<span style="color:green">' + '已撤銷頁面 ' + pageLink(edit.title) + ' 的修訂版本 ' + pageLink('Special:Diff/' + edit.revid, edit.revid) + '</span>');
                } else {
                    print('<span style="color:red">' + '無法撤銷頁面 ' + pageLink(edit.title) + ' 的修訂版本 ' + pageLink('Special:Diff/' + edit.revid, edit.revid) + '</span>');
                }
            };
        };

        for (var i=0; i<edits.length; i++) {
            var cb = callback(edits[i]);
            $.ajax({
                url: mw.util.wikiScript('api'),
                data: {
                    format: 'json',
                    action: 'edit',
                    title: edits[i].title,
                    undo: edits[i].revid,      // 換成 undoafter 更狠
                    minor: true,
                    bot: true,
                    summary: summary,
                    token: mw.user.tokens.get('editToken')
                },
                dataType: 'json',
                type: 'POST',
            }).then(cb);
        }
    };

    var monitor = function () {
        getNewEdits(uid, now).then(function (data) {
            now = new Date().getTime();

            var edits = [];
            if (data.query && data.query.usercontribs) {
                for (var i = 0; i<data.query.usercontribs.length; i++) {
                    var rev = data.query.usercontribs[i];
                    print('新編輯：修訂版本 ' + rev.revid + ' 位置 ' + pageLink(rev.title));
                    edits.push({
                        title: rev.title,
                        revid: rev.revid
                    });
                }
            }

            undo(edits);
        });
    };

    var start = function () {
        $('#content').html('正在監視 ' + uid + ' 的編輯……時間間隔 ' + DELAY + ' 秒。');

        summary = SUMMARY.replace(/\$1/g, uid);

        timerId = setInterval(monitor, DELAY * 1000);
        now = new Date().getTime();
    };

    var stop = function () {
        clearInterval(timerId);
        timerId = null;
        print('已停止。');
    };

    $(mw.util.addPortletLink('p-cactions', '#', '自動跟蹤與回退編輯')).click(function (e) {
        if (timerId !== null) {
            alert('請開新視窗。');
            return;
        }

        uid = prompt('請輸入用戶名。確定之後將會跟蹤此用戶的編輯，並將其全部回退。（之前的編輯請手動回退）');

        if (uid !== null) {
            start();
        }
    });
});
