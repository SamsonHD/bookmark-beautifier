function printBookmarks(makeSortable, slideDownChildren, showChildren, callbackList) {
    chrome.bookmarks.getTree(function(root) {
        //console.log(root);
        $('#bookmarks').empty();
        ROOT_TABS = root[0].children.length;
        root.forEach(function(folder) {
            $('#bookmarks').append(printBookmarkFolder(folder, showChildren));
            $('#bookmarks .bFolder').each(function(index, val) {
                var depth = $(val).parents("ul").length,
                    padding = 20;
                $(val).children().find('a').css('padding-left', depth * padding);
            });
            if (makeSortable) {
                sortableList();
            }
            if (slideDownChildren) {
                showFolderChildren(true);
            }
            if (callbackList) {
                for (var i = 0, len = callbackList.length; i < len; i++) {
                    callbackList[i]();
                }
            }
        });
    });
}

function printBookmarkFolder(bookmarkFolder, notShowChildren) {
    var list = $("<ul>");
    bookmarkFolder.children.forEach(function(bookmark) {
        if (typeof bookmark.url != 'undefined') {
            list.append(printNode(bookmark));
        } else {
            var folder = printNodeFolder(bookmark);
            var r = $("<button type=\"submit\" class=\"dropIcon\"><i class=\"fa fa-chevron-right\"></i></button>");
            $(folder).find("a").prepend(r);
            folder.append(printBookmarkFolder(bookmark, notShowChildren));
            if (EDIT_MODE && bookmark.children.length === 0)
                folder.addClass("is-empty");
            list.append(folder);
            $(r).click(function(e) {
                if ($(folder).find('li').is(':visible')) {
                    $('.fa', this).removeClass("fa-chevron-down");
                    $('.fa', this).addClass("fa-chevron-right");
                    $(folder).children().hide();
                    $(folder).find('.dropIcon').show();
                    $(folder).find('a').css('display', 'inline-block');
                } else {
                    $('.fa', this).removeClass("fa-chevron-right");
                    $('.fa', this).addClass("fa-chevron-down");
                    $(folder).children().show();
                }

            });
            if (notShowChildren)
                return;
            if (bookmark.id > ROOT_TABS) {
                $(folder).children().hide();
                $(folder).find('.dropIcon').show();
                $(folder).find('a').css('display', 'inline-block');
            } else {
                $(folder).children('a').find('.fa').removeClass("fa-chevron-right");
                $(folder).children('a').find('.fa').addClass("fa-chevron-down");
            }

        }
    });
    return list;
}

function printNode(bookmark) {
    var li = $("<li>")
        .attr('class', 'bLink');
    var link = $("<a />", {
        href: bookmark.url,
        text: bookmark.title
    });
    li.append(link);
    return li;
}

function printNodeFolder(bookmark) {
    var li = $("<li>")
        .attr('class', 'bFolder');
    var link = $("<a />", {
        text: bookmark.title
    });
    li.append(link);
    return li;
}

function previewFunction(callbackFunction) {
    var keys = {
        children: []
    };
    chrome.bookmarks.getTree(function(root) {
        root[0].children.forEach(function(folder) {
            keys.children.push(folder);
        });

        callbackFunction(keys);
        updateBookmarkListBuffer(keys);
    });
}

function updateBookmarks(list, printAfter) {
    list.children.forEach(function(folder, key) {
        if (typeof folder.url === 'undefined') {
            if (folder.create) {
                chrome.bookmarks.create({
                    'parentId': folder.parentId,
                    'title': folder.title
                }, function(e) {
                    folder.children.forEach(function(bookmark) {
                        bookmark.parentId = e.id;
                    });
                    if (key === list.children.length - 1)
                        updateBookmarks(folder, true);
                    else
                        updateBookmarks(folder, false);
                });
                return;
            } else {
                updateBookmarks(folder, false);
            }
        }

        if (folder.id <= ROOT_TABS)
            return;

        if (folder.rename) {
            chrome.bookmarks.update(String(folder.id), {
                'title': folder.title
            });
        }

        chrome.bookmarks.move(String(folder.id), {
            'parentId': folder.parentId,
            'index': key
        }, function callback() {
            if (printAfter && key === list.children.length - 1)
                printBookmarks();
        });
    });
}

function updateBookmarkListBuffer(keys) {
    $('#bookmarks').empty();
    $('#bookmarks').append(printBookmarkFolder(keys));
    $('#bookmarks .bFolder').each(function(index, val) {
        var depth = $(val).parents("ul").length,
            padding = 20;
        $(val).children().find('a').css('padding-left', depth * padding);
    });
    $('#reject').one("click", function(e) {
        e.preventDefault();
        $('#apply').unbind("click");
        printBookmarks();
        toggleAllButtons();
    });
    $('#apply').one("click", function(e) {
        e.preventDefault();
        $('#reject').unbind("click");
        updateBookmarks(keys, true);
        toggleAllButtons();
    });
}

function showFolderChildren(collapse) {
    $("#bookmarks ul").each(function(key, e) {
        if (!collapse) {
            //ignores main ul, which shows root folders
            if (key > 0) {
                var parentTitle = $(e).parent().contents().filter(function() {
                    return this.nodeType == 3;
                })[0].nodeValue;
                if (parentTitle === "Bookmarks bar" || parentTitle === "Other bookmarks" || parentTitle === "Mobile bookmarks")
                    return;
                $(e).slideUp(300, function() {
                    $(e).siblings('a').find('.fa').removeClass("fa-chevron-down");
                    $(e).siblings('a').find('.fa').addClass("fa-chevron-right");
                });
            }
        } else {
            if (!$(e).is(":visible")) {
                $(e).slideDown(300, function() {
                    $(e).siblings('a').find('.fa').removeClass("fa-chevron-right");
                    $(e).siblings('a').find('.fa').addClass("fa-chevron-down");
                });

            }
        }
    });
}
