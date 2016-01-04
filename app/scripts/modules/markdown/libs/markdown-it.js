/* global define */
define([
    'underscore',
    'q',
    'markdown-it',
    'prism/bundle',
    'markdown-it-san',
    'markdown-it-hash',
    'markdown-it-math',
    'modules/markdown/libs/markdown-it-task',
], function(_, Q, MarkdownIt, Prism, sanitizer, hash, math, task) {
    'use strict';

    /**
     * Markdown parser helper.
     */
    function Markdown() {

        // Initialize MarkdownIt
        this.md = new MarkdownIt({
            html     : true,
            xhtmlOut : true,
            breaks   : true,
            linkify  : true,
            highlight: function(code, lang) {
                if (!Prism.languages[lang]) {
                    return '';
                }

                return Prism.highlight(code, Prism.languages[lang]);
            }
        });

        this.configure();
    }

    _.extend(Markdown.prototype, {

        /**
         * Configure MarkdownIt.
         */
        configure: function() {
            this.md
            .use(sanitizer)
            .use(math, {
                inlineOpen       : '$',
                inlineClose      : '$',
                blockOpen        : '$$',
                blockClose       : '$$',
                renderingOptions : {},
                inlineRenderer   : function(tokens) {
                    return '<span class="math inline">$' + tokens + '$</span>';
                },
                blockRenderer    : function(tokens) {
                    return '<div class="math block">$$' + tokens + '$$</div>';
                },
            })
            .use(hash)
            .use(task.init)
            ;

            this.md.renderer.rules.hashtag_open  = function(tokens, idx, f, env) { // jshint ignore:line
                var tagName = tokens[idx].content.toLowerCase();

                if (env) {
                    env.tags = env.tags || [];
                    env.tags.push(tagName);
                }

                return '<a href="#/notes/f/tag/q/' + tagName + '" class="label label-default">';
            };
        },

        /**
         * Convert Markdown to HTML.
         */
        render: function(content) {
            // this.toggleTask(6, content);
            return new Q(
                this.md.render(content)
            );
        },

        /**
         * Toggle a task's status.
         */
        taskToggle: function(data) {
            data.content = task.toggle(data);

            return this.parse(data.content)
            .then(function(env) {
                return _.extend({content: data.content}, env);
            });
        },

        /**
         * Parse Markdown for tags, tasks, etc.
         */
        parse: function(content) {
            var env = {};

            return new Q(
                this.md.render(content, env)
            )
            .then(function() {
                env.tags    = _.uniq(env.tags);
                env.taskAll = env.tasks.length;
                return env;
            });
        },
    });

    return Markdown;
});
