$(function () {

    var uid = null;
    var delaz= null;
    var summarz = null;

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
                    print('<span style="color:green">' + pageLink(edit.title) + ' 修訂版本 ' + pageLink('Special:Diff/' + edit.revid, edit.revid) + ' 復原' + '</span>');
                } else {
                    print('<span style="color:red">' + '復原 ' + pageLink(edit.title) + ' 到修訂版本 ' + pageLink('Special:Diff/' + edit.revid, edit.revid) + ' 的先前版本時發生錯誤' + '</span>');
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
                    undo: edits[i].revid,      // 换成 undoafter 更狠
                    minor: true,
                    bot: true,
                    summary: summary,
                    token: mw.user.tokens.get('csrfToken')
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
                    print('新的編輯：修訂版本 ' + rev.revid + ' 位於 ' + pageLink(rev.title));
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
        $('#content').html('正在監視 ' + uid + ' 所有編輯…… 時間間隔為 ' + delaz + ' 秒。');

        summary = summarz.replace(/\$1/g, uid);

        timerId = setInterval(monitor, delaz * 1000);
        now = new Date().getTime();
    };

    var stop = function () {
        clearInterval(timerId);
        timerId = null;
        print('已停止。');
    };

    $(mw.util.addPortletLink('p-cactions', '#', '自動跟蹤編輯並復原')).click(function (e) {
        if (timerId !== null) {
            alert('請打開新窗口');
            return;
        }

        uid = prompt('輸入想要跟蹤並復原其編輯的使用者：（先前的破壞請手動進行復原）');
        if(uid!==null){
        delaz = prompt('Time(sec)','10');
          if(delaz!==null){
        summarz = prompt('編輯摘要', '自動撤銷[[Special:Contributions/$1|$1]]（[[User_talk:$1|讨论]]）的所有編輯；更改回上一個修訂版本');}}

        if (uid !== null && delaz!==null && summarz!==null) {
            start();
        }
    });
});
