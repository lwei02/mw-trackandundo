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
                    print('<span style="color:green">' + pageLink(edit.title) + ' 的修订版本 ' + pageLink('Special:Diff/' + edit.revid, edit.revid) + ' 已回退' + '</span>');
                } else {
                    print('<span style="color:red">' + '回退页面 ' + pageLink(edit.title) + ' 的修订版本 ' + pageLink('Special:Diff/' + edit.revid, edit.revid) + ' 时发生错误' + '</span>');
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
                    print('新的编辑：修订版本 ' + rev.revid + ' 位置 ' + pageLink(rev.title));
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
        $('#content').html('正在监视 ' + uid + ' 的所有编辑……时间间隔为 ' + delaz + ' 秒。');

        summary = summarz.replace(/\$1/g, uid);

        timerId = setInterval(monitor, delaz * 1000);
        now = new Date().getTime();
    };

    var stop = function () {
        clearInterval(timerId);
        timerId = null;
        print('已停止。');
    };

    $(mw.util.addPortletLink('p-cactions', '#', '自动跟踪编辑并回退')).click(function (e) {
        if (timerId !== null) {
            alert('请打开新窗口');
            return;
        }

        uid = prompt('输入想要跟踪并回退的用户：（先前的破坏请手动回退）');
        if(uid!==null){
        delaz = prompt('Time(sec)','10');
          if(delaz!==null){
        summarz = prompt('摘要', '#自动脚本协助）（取消由[[Special:Contributions/$1|$1]]（[[User_talk:$1|讨论]]）作出的编辑；更改回前一个修订版本');}}

        if (uid !== null && delaz!==null && summarz!==null) {
            start();
        }
    });
});
