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
                    print('<span style="color:green"> revision ' + pageLink(edit.title) + ' of ' + pageLink('Special:Diff/' + edit.revid, edit.revid) + ' has been rollbacked.' + '</span>');
                } else {
                    print('<span style="color:red">' + 'error: failed to undo revision ' + pageLink('Special:Diff/' + edit.revid, edit.revid) + ' of ' + pageLink(edit.title) + '</span>');
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
                    print('new edit: revision ' + rev.revid + ' at ' + pageLink(rev.title));
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
        $('#content').html('monitoring all edits of ' + uid + ' ... (refreshing rate: ' + delaz + ' seconds.)');

        summary = summarz.replace(/\$1/g, uid);

        timerId = setInterval(monitor, delaz * 1000);
        now = new Date().getTime();
    };

    var stop = function () {
        clearInterval(timerId);
        timerId = null;
        print('stopped.');
    };

    $(mw.util.addPortletLink('p-cactions', '#', 'AutoUndo')).click(function (e) {
        if (timerId !== null) {
            alert('Please open a new window.');
            return;
        }

        uid = prompt('The user you want to monitor and rollback: (Please undo previous vandals manually)');
        if(uid!==null){
        delaz = prompt('Time(sec)','10');
          if(delaz!==null){
        summarz = prompt('Summary:', 'Reverted edits by [[Special:Contributions/$1|$1]]（[[User_talk:$1|talk]]）to last version by the previous user');}}

        if (uid !== null && delaz!==null && summarz!==null) {
            start();
        }
    });
});
