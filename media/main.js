(function () {
    'use strict';

    const viewmodels = new Map();
    class ViewModelService {
        model(vmId) {
            let collection = viewmodels.get(this.vmc);
            if (!collection) {
                collection = { counter: 1, vms: new Map() };
                viewmodels.set(this.vmc, collection);
            }
            let viewmodel = collection.vms.get(vmId);
            if (viewmodel)
                return viewmodel;
            viewmodel = new this.vmc();
            viewmodel.id = vmId || `${this.name}-${collection.counter++}`;
            collection.vms.set(vmId, viewmodel);
            return viewmodel;
        }
        static requestUpdate(vmc) {
            if (vmc) {
                const collection = viewmodels.get(vmc);
                if (collection) {
                    for (const vm of collection.vms.values())
                        vm.requestUpdate();
                }
            }
            else {
                for (const collection of viewmodels.values()) {
                    for (const vm of collection.vms.values())
                        vm.requestUpdate();
                }
            }
        }
    }

    var _a$9, _b$2;
    const BINDINGS = Symbol.for('bindings');
    const CLASSNAMES = Symbol.for('classnames');
    const CONDITIONALS = Symbol.for('conditionals');
    const QUERIES = Symbol.for('queries');
    const SERVICE = Symbol.for('service');
    const SHADOW_ROOT = Symbol.for('shadowRoot');
    const STYLES = Symbol.for('styles');
    const TEMPLATE = Symbol.for('template');
    const VIEWMODEL = Symbol.for('viewmodel');
    const findBinding = /^\[\((.+)\)\]$|^\[(.+)\]$|^\((.+)\)$/;
    const findParathensis = /\s*\(\s*\)\s*$/;
    const findScope = /\{\{\s*(.+?)\s*\}\}/;
    function L13Component(options) {
        return function (target) {
            if (!hasParentClass(target, L13Element)) {
                throw new TypeError(`Class for '${options.name}' is not a child class of 'L13Element'!`);
            }
            if (!hasParentClass(options.service, ViewModelService)) {
                throw new TypeError(`Service for '${options.name}' is not a child class of 'ViewModelService'!`);
            }
            target.prototype[SERVICE] = new options.service();
            if (options.styles)
                target.prototype[STYLES] = createStyles(options.styles);
            if (options.template)
                target.prototype[TEMPLATE] = createTemplate(options.template);
            customElements.define(options.name, target);
        };
    }
    function L13Query(rule) {
        return function (prototype, name) {
            if (!prototype[QUERIES])
                prototype[QUERIES] = new Map();
            prototype[QUERIES].set(name, rule);
        };
    }
    function L13Class(classNames) {
        return function (prototype, name) {
            if (!prototype[CLASSNAMES])
                prototype[CLASSNAMES] = new Map();
            prototype[CLASSNAMES].set(name, classNames);
        };
    }
    class L13Element extends HTMLElement {
        get vmId() {
            return this.getAttribute('vmId');
        }
        set vmId(id) {
            if (this[VIEWMODEL])
                this[VIEWMODEL].dispose(this);
            const vm = this[SERVICE].model(id);
            vm.connect(this);
            vm.requestUpdate();
            this.setAttribute('vmId', vm.id);
            this[VIEWMODEL] = vm;
        }
        get viewmodel() {
            return this[VIEWMODEL];
        }
        set viewmodel(vm) {
            if (!(vm instanceof this[SERVICE].vmc)) {
                throw new TypeError('viewmodel is not for this component!');
            }
            if (this[VIEWMODEL])
                this[VIEWMODEL].dispose(this);
            this.setAttribute('vmId', vm.id);
            vm.connect(this);
            vm.requestUpdate();
            this[VIEWMODEL] = vm;
        }
        constructor() {
            super();
            this[_a$9] = new Map();
            this[_b$2] = new Map();
            const shadowRoot = this[SHADOW_ROOT] = this.attachShadow({ mode: 'closed' });
            if (this[STYLES])
                shadowRoot.appendChild(this[STYLES].cloneNode(true));
            if (this[TEMPLATE]) {
                shadowRoot.appendChild(this[TEMPLATE].content.cloneNode(true));
                if (this[QUERIES]) {
                    for (const [name, query] of this[QUERIES])
                        this[name] = shadowRoot.querySelector(query);
                }
            }
            bindElements(this);
        }
        connectedCallback() {
            if (!this[VIEWMODEL])
                initViewModel(this);
        }
        update(...args) {
            const viewmodel = this[VIEWMODEL];
            for (const [element, { cmd, comment }] of this[CONDITIONALS]) {
                const value = !!get(viewmodel, cmd);
                if (value) {
                    if (!element.parentNode)
                        comment.parentNode.replaceChild(element, comment);
                }
                else if (!comment.parentNode)
                    element.parentNode.replaceChild(comment, element);
            }
            for (const [element, bindings] of this[BINDINGS]) {
                for (const [name, cmd] of bindings) {
                    const value = get(viewmodel, cmd);
                    if (value !== undefined)
                        element[name] = value;
                }
            }
            if (this[CLASSNAMES]) {
                for (const [name, classNames] of this[CLASSNAMES]) {
                    const element = this[name];
                    for (const [className, path] of Object.entries(classNames)) {
                        if (get(viewmodel, path))
                            element.classList.add(className);
                        else
                            element.classList.remove(className);
                    }
                }
            }
        }
        dispatchCustomEvent(type, detail) {
            this.dispatchEvent(new CustomEvent(type, { detail, bubbles: false }));
        }
    }
    _a$9 = BINDINGS, _b$2 = CONDITIONALS;
    function hasParentClass(child, parent) {
        do {
            const currentParent = Object.getPrototypeOf(child);
            if (currentParent === parent)
                return true;
            child = currentParent;
        } while (child);
        return false;
    }
    function getAttributes(element) {
        if (!element.attributes.length)
            return null;
        const attributes = element.attributes;
        const length = attributes.length;
        const map = {};
        let i = 0;
        let name;
        while (i < length && (name = attributes[i++].nodeName)) {
            map[name] = element.getAttribute(name);
        }
        return map;
    }
    function getAllTextNodes(root) {
        const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let node;
        while ((node = walk.nextNode()))
            textNodes.push(node);
        return textNodes.length ? textNodes : null;
    }
    function initViewModel(component) {
        const vm = component[SERVICE].model(component.vmId);
        vm.connect(component);
        vm.requestUpdate();
        component[VIEWMODEL] = vm;
    }
    function registerBinding(component, element, name, cmd) {
        const bindings = component[BINDINGS];
        let elementBindings = bindings.get(element);
        if (!elementBindings) {
            elementBindings = new Map();
            bindings.set(element, elementBindings);
        }
        if (name === 'model') {
            if (element instanceof HTMLInputElement && element.getAttribute('type') === 'checkbox')
                name = 'checked';
            else
                name = 'value';
        }
        elementBindings.set(name, cmd);
    }
    function registerEvent(component, element, name, cmd) {
        if (name === 'model') {
            if (element instanceof HTMLInputElement && element.getAttribute('type') === 'checkbox') {
                element.addEventListener('change', () => {
                    const viewmodel = component[VIEWMODEL];
                    set(viewmodel, cmd, element.checked);
                    viewmodel.requestUpdate();
                });
            }
            else if (element instanceof HTMLInputElement && element.getAttribute('type') === 'text') {
                element.addEventListener('input', () => {
                    const viewmodel = component[VIEWMODEL];
                    set(viewmodel, cmd, element.value);
                    viewmodel.requestUpdate();
                });
            }
        }
        else {
            element.addEventListener(name, () => {
                const viewmodel = component[VIEWMODEL];
                run(viewmodel, cmd);
                viewmodel.requestUpdate();
            });
        }
    }
    function registerCondition(component, element, cmd) {
        const comment = document.createComment(`[if]=${cmd}`);
        component[CONDITIONALS].set(element, { cmd, comment });
    }
    function bindElements(component) {
        const elements = component[SHADOW_ROOT].querySelectorAll('*');
        if (elements.length) {
            elements.forEach((element) => {
                const attributes = getAttributes(element);
                if (!attributes)
                    return;
                for (const [key, value] of Object.entries(attributes)) {
                    const matches = findBinding.exec(key);
                    if (!matches)
                        continue;
                    const [, bindon, bind, on] = matches;
                    const name = bindon || bind || on;
                    if (bindon || bind) {
                        if (name === 'if')
                            registerCondition(component, element, value);
                        else
                            registerBinding(component, element, name, value);
                    }
                    if (bindon || on)
                        registerEvent(component, element, name, value);
                }
            });
        }
        const textNodes = getAllTextNodes(component[SHADOW_ROOT]);
        textNodes === null || textNodes === void 0 ? void 0 : textNodes.forEach((textNode) => {
            if (!textNode.parentNode || textNode.parentNode.nodeName === 'STYLE' || textNode.parentNode.nodeName === 'SCRIPT')
                return;
            let text = textNode.nodeValue;
            if (!text)
                return;
            let match = findScope.exec(text);
            if (!match)
                return;
            const fragment = document.createDocumentFragment();
            do {
                fragment.appendChild(document.createTextNode(text.slice(0, match.index)));
                const scope = document.createTextNode('');
                registerBinding(component, scope, 'nodeValue', match[1]);
                fragment.appendChild(scope);
                text = text.slice(match.index + match[0].length);
            } while ((match = findScope.exec(text)));
            if (text)
                fragment.appendChild(document.createTextNode(text));
            textNode.parentNode.replaceChild(fragment, textNode);
        });
    }
    function get(context, path) {
        const names = path.split('.');
        let name = names.shift();
        while (name && context != null) {
            context = context[name];
            if (context == null && names.length)
                return;
            name = names.shift();
        }
        return name === '' ? undefined : context;
    }
    function set(context, path, value) {
        const names = path.split('.');
        let name = names.shift();
        while (name && context != null) {
            if (!names.length) {
                context[name] = value;
                return;
            }
            context = context[name];
            if (context == null)
                return;
            name = names.shift();
        }
    }
    function run(context, path) {
        const names = path.split('.');
        let name = names.shift();
        while (name && context != null) {
            if (!names.length) {
                name = name.replace(findParathensis, '');
                if (typeof context[name] === 'function')
                    context[name]();
                return;
            }
            context = context[name];
            if (context == null)
                return;
            name = names.shift();
        }
    }
    function createStyles(styles) {
        const fragment = document.createDocumentFragment();
        styles.forEach((text) => {
            const style = document.createElement('STYLE');
            style.textContent = text;
            fragment.appendChild(style);
        });
        return fragment;
    }
    function createTemplate(template) {
        const templateElement = document.createElement('TEMPLATE');
        templateElement.innerHTML = template;
        return templateElement;
    }

    function remove(values, value) {
        const index = values.indexOf(value);
        if (index !== -1)
            values.splice(index, 1);
    }

    var _a$8;
    const IS_STOPPED = Symbol.for('isStopped');
    class Event {
        constructor(options) {
            this[_a$8] = false;
            this.type = options.type;
        }
        get isStopped() {
            return this[IS_STOPPED];
        }
        stopPropagation() {
            this[IS_STOPPED] = true;
        }
    }
    _a$8 = IS_STOPPED;

    var _a$7;
    const LISTENERS$1 = Symbol.for('listeners');
    class EventDispatcher {
        constructor() {
            this[_a$7] = Object.create(null);
        }
        on(name, listener) {
            const listeners = this[LISTENERS$1][name] || (this[LISTENERS$1][name] = []);
            listeners[listeners.length] = listener;
        }
        hasEvent(name) {
            return !!this[LISTENERS$1][name];
        }
        hasEventListener(name, listener) {
            const listeners = this[LISTENERS$1][name] || null;
            if (!listeners)
                return false;
            return listeners.includes(listener);
        }
        dispatchEvent(nameOrEvent, ...args) {
            let event = nameOrEvent instanceof Event ? nameOrEvent : null;
            const name = (event ? event.type : nameOrEvent);
            let listeners = this[LISTENERS$1][name] || null;
            if (listeners) {
                listeners = listeners.slice(0);
                const values = [event || (event = new Event({ type: name }))];
                let i = 0;
                let listener;
                if (args.length)
                    values.push(...args);
                while ((listener = listeners[i++])) {
                    listener.apply(this, values);
                    if (event.isStopped)
                        return false;
                }
                return true;
            }
            return false;
        }
        removeEventListener(name, listener) {
            const listeners = this[LISTENERS$1][name] || null;
            if (listeners) {
                remove(listeners, listener);
                if (!listeners.length)
                    delete this[LISTENERS$1][name];
            }
        }
    }
    _a$7 = LISTENERS$1;

    var _a$6;
    const COMPONENTS = Symbol.for('components');
    const VM_ID = Symbol.for('vmId');
    const refreshComponents = new Map();
    class ViewModel extends EventDispatcher {
        constructor() {
            super(...arguments);
            this[_a$6] = [];
        }
        get id() {
            return this[VM_ID];
        }
        set id(value) {
            this[VM_ID] = value;
        }
        connect(component) {
            const components = this[COMPONENTS];
            if (!components.includes(component))
                components.push(component);
        }
        dispose(component) {
            remove(this[COMPONENTS], component);
        }
        requestUpdate(args) {
            let request = refreshComponents.get(this);
            if (!request) {
                request = [new Promise((resolve) => {
                        requestAnimationFrame(() => {
                            const params = refreshComponents.get(this)[1];
                            this[COMPONENTS].forEach(params ? (component) => component.update(params) : (component) => component.update());
                            refreshComponents.delete(this);
                            this.dispatchEvent('update');
                            resolve(undefined);
                        });
                    })];
                if (args)
                    request.push(Object.assign({}, args));
                refreshComponents.set(this, request);
            }
            else if (args) {
                const params = request[1];
                request[1] = params ? Object.assign(Object.assign({}, params), args) : Object.assign({}, args);
            }
            return request[0];
        }
    }
    _a$6 = COMPONENTS;

    var _a$5;
    const LISTENERS = Symbol.for('listeners');
    class Message {
        constructor(root) {
            this.root = root;
            this[_a$5] = Object.create(null);
            window.addEventListener('message', (event) => {
                const message = event.data;
                const command = message.command;
                const data = message.data;
                const listeners = this[LISTENERS][command];
                if (listeners)
                    listeners.forEach((listener) => listener(data));
            });
        }
        on(name, listener) {
            const listeners = this[LISTENERS][name] || (this[LISTENERS][name] = []);
            listeners[listeners.length] = listener;
        }
        send(command, data = null) {
            this.root.postMessage({ command, data });
        }
        removeMessageListener(name, listener) {
            if (!listener)
                return delete this[LISTENERS][name];
            const listeners = this[LISTENERS][name] || null;
            if (listeners) {
                remove(listeners, listener);
                if (!listeners.length)
                    delete this[LISTENERS][name];
            }
        }
    }
    _a$5 = LISTENERS;

    const findLanguageClassName = /^language\-/;
    function detectLanguage() {
        document.body.classList.forEach((classname) => {
            if (findLanguageClassName.test(classname))
                classname.replace(findLanguageClassName, '');
        });
    }

    let isMacOs = false;
    let isWindows = false;
    let isLinux = false;
    function detectPlatform() {
        const body = document.body;
        isMacOs = !!body.classList.contains('platform-mac');
        isWindows = !!body.classList.contains('platform-win');
        isLinux = !!body.classList.contains('platform-linux');
    }
    function changePlatform() {
        let platform;
        if (isMacOs) {
            isMacOs = false;
            isWindows = true;
            platform = 'Windows';
        }
        else if (isWindows) {
            isWindows = false;
            isLinux = true;
            platform = 'Linux';
        }
        else {
            isLinux = false;
            isMacOs = true;
            platform = 'macOS';
        }
        console.log(`Changed platform to '${platform}'`);
    }

    var icons = {
        "case-sensitive.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><g transform=\"matrix(1,0,0,1,2,2)\"><path d=\"M7.611,11.834L6.72,9.484L3.158,9.484L2.32,11.834L1.225,11.834L4.442,3.432L5.462,3.432L8.702,11.834L7.611,11.834ZM5.08,5.02L5.036,4.885L4.998,4.729L4.969,4.577L4.945,4.451L4.922,4.451L4.901,4.577L4.869,4.729L4.831,4.885L4.787,5.02L3.48,8.594L6.398,8.594L5.08,5.02ZM13.02,11.834L13.02,10.896L12.997,10.896C12.798,11.248 12.541,11.516 12.226,11.702C11.911,11.888 11.553,11.98 11.151,11.98C10.838,11.98 10.563,11.935 10.325,11.845C10.087,11.755 9.887,11.633 9.727,11.479C9.567,11.325 9.446,11.141 9.364,10.928C9.282,10.715 9.24,10.486 9.24,10.24C9.24,9.978 9.279,9.738 9.357,9.519C9.435,9.3 9.555,9.107 9.717,8.939C9.879,8.771 10.084,8.631 10.332,8.52C10.58,8.409 10.876,8.33 11.22,8.283L13.031,8.031C13.031,7.758 13.002,7.524 12.943,7.331C12.884,7.138 12.8,6.98 12.691,6.859C12.582,6.738 12.45,6.649 12.295,6.592C12.14,6.535 11.97,6.507 11.782,6.507C11.419,6.507 11.068,6.571 10.73,6.7C10.392,6.829 10.092,7.01 9.826,7.24L9.826,6.256C9.908,6.197 10.022,6.135 10.169,6.068C10.316,6.001 10.481,5.94 10.664,5.883C10.847,5.826 11.042,5.779 11.247,5.742C11.452,5.705 11.654,5.686 11.853,5.686C12.552,5.686 13.082,5.88 13.441,6.269C13.8,6.658 13.98,7.211 13.98,7.93L13.98,11.832L13.02,11.832L13.02,11.834ZM11.566,9.004C11.293,9.039 11.068,9.089 10.892,9.153C10.716,9.217 10.579,9.297 10.482,9.39C10.385,9.483 10.317,9.595 10.28,9.724C10.243,9.853 10.225,10 10.225,10.164C10.225,10.305 10.25,10.435 10.301,10.557C10.352,10.679 10.425,10.784 10.521,10.873C10.617,10.962 10.736,11.033 10.878,11.084C11.02,11.135 11.186,11.16 11.373,11.16C11.615,11.16 11.838,11.115 12.041,11.025C12.244,10.935 12.419,10.811 12.565,10.653C12.711,10.495 12.826,10.309 12.908,10.096C12.99,9.883 13.031,9.654 13.031,9.408L13.031,8.799L11.566,9.004Z\" style=\"fill-rule:nonzero;\"/></g></svg>",
        "checked.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"11px\" height=\"11px\" viewBox=\"0 0 11 11\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M11,2.763l-7.193,6.172l-0.721,-0.042l-3.086,-3.597l0.763,-0.678l2.747,3.214l6.811,-5.832l0.679,0.763Z\"/></svg>",
        "close.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M10,10.707l3.646,3.647l0.708,-0.707l-3.647,-3.647l3.647,-3.646l-0.708,-0.708l-3.646,3.647l-3.646,-3.647l-0.708,0.708l3.647,3.646l-3.647,3.646l0.708,0.708l3.646,-3.647Z\"/></svg>",
        "copy-file.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><g transform=\"matrix(1,0,0,1,-4,2)\"><path d=\"M5,10L5,13L4,12L4,10L5,10ZM8,13L6,13L6,12L8,12L8,13ZM11,13L9,13L9,12L11,12L11,13ZM14,10L14,12L13,13L12,13L12,12L13,12L13,10L14,10ZM13,9L13,7L14,7L14,9L13,9ZM4,9L4,7L5,7L5,9L4,9ZM9,6L9,4L10,4L10,5L11,5L11,6L9,6ZM4,6L4,4L5,4L5,6L4,6ZM4,3L4,2L5,1L5,3L4,3ZM8,2L6,2L6,1L8,1L8,2ZM9,1L10,1L10.707,1.293L13.707,4.293L14,5L14,6L12,6L12,5L13,5L10,2L10,3L9,3L9,1Z\"/></g><path d=\"M5,3L5,2L6,1L11,1L11.707,1.293L14.707,4.293L15,5L15,12L14,13L10,13L10,12L14,12L14,6L10,6L10,2L6,2L6,3L5,3ZM14,5L11,2L11,5L14,5Z\"/></svg>",
        "copy-left.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"40px\" height=\"20px\" viewBox=\"0 0 40 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M28,17L28,18L26,18L25,17L28,17ZM31,18L29,18L29,17L31,17L31,18ZM34,18L32,18L32,17L34,17L34,18ZM37,18L35,18L35,17L38,17L37,18ZM37,16L37,14L38,14L38,16L37,16ZM26,14L26,16L25,16L25,14L26,14ZM37,13L37,11L38,11L38,13L37,13ZM37,10L37,8L38,8L38,10L37,10ZM26,5L26,7L25,7L25,5L26,5ZM35.854,4.854L36.561,4.146L37.707,5.293L38,6L38,7L36,7L36,6L37,6L35.854,4.854ZM33,7L33,5L34,5L34,6L35,6L35,7L33,7ZM33,2L34,2L34.707,2.293L35.854,3.439L35.146,4.146L34,3L34,4L33,4L33,2ZM26,2L26,4L25,4L25,3L26,2ZM32,3L30,3L30,2L32,2L32,3ZM29,2L27,2L27,3L29,3L29,2Z\"/><g transform=\"matrix(1,0,0,1,1,0)\"><path d=\"M23.57,10L20.7,7.13L21.318,6.511L24.985,10.178L24.985,10.796L21.318,14.463L20.7,13.844L23.544,11L17,11L17,10L23.57,10Z\"/></g><g transform=\"matrix(1,0,0,1,-1,1)\"><path d=\"M4,1L3,2L3,16L4,17L15,17L16,16L16,5L15.707,4.293L12.707,1.293L12,1L4,1ZM4,16L4,2L11,2L11,6L15,6L15,16L4,16ZM15,5L12,2L12,5L15,5Z\"/></g></svg>",
        "copy-right.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"40px\" height=\"20px\" viewBox=\"0 0 40 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><g transform=\"matrix(1,0,0,1,23,1)\"><path d=\"M3,1L2,2L2,16L3,17L14,17L15,16L15,5L14.707,4.293L11.707,1.293L11,1L3,1ZM3,16L3,2L10,2L10,6L14,6L14,16L3,16ZM14,5L11,2L11,5L14,5Z\"/></g><path d=\"M15.441,11L18.285,13.844L17.667,14.463L14,10.796L14,10.178L17.667,6.511L18.285,7.13L15.415,10L22,10L22,11L15.441,11ZM14.928,10.487L14.941,10.5L14.941,10.475L14.928,10.487Z\"/><g transform=\"matrix(1,0,0,1,-23,-1.77636e-15)\"><path d=\"M28,17L28,18L26,18L25,17L28,17ZM31,18L29,18L29,17L31,17L31,18ZM34,18L32,18L32,17L34,17L34,18ZM37,18L35,18L35,17L38,17L37,18ZM37,16L37,14L38,14L38,16L37,16ZM26,14L26,16L25,16L25,14L26,14ZM25,13L25,11L26,11L26,13L25,13ZM25,10L25,8L26,8L26,10L25,10ZM26,5L26,7L25,7L25,5L26,5ZM35.854,4.854L36.561,4.146L37.707,5.293L38,6L38,7L36,7L36,6L37,6L35.854,4.854ZM33,7L33,5L34,5L34,6L35,6L35,7L33,7ZM33,2L34,2L34.707,2.293L35.854,3.439L35.146,4.146L34,3L34,4L33,4L33,2ZM26,2L26,4L25,4L25,3L26,2ZM32,3L30,3L30,2L32,2L32,3ZM29,2L27,2L27,3L29,3L29,2Z\"/></g></svg>",
        "delete-file.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><g transform=\"matrix(1,0,0,1,0,-1)\"><path d=\"M5,4L5,2.994C5.003,2.445 5.45,2 6,2L9.006,2C9.555,2.003 10,2.45 10,3L10,4L13,4L13,5L12,5L12,14L11,15L4,15L3,14L3,5L2,5L2,4L5,4ZM4,5L4,14L11,14L11,5L4,5ZM6,6L5,6L5,13L6,13L6,6ZM8,6L7,6L7,13L8,13L8,6ZM10,6L9,6L9,13L10,13L10,6ZM9,4L9,3L6,3L6,4L9,4Z\"/></g></svg>",
        "folder.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M0.011,1.5L0.511,1L6.507,1L6.861,1.146L7.713,1.999L15.501,1.999L16.001,2.499L15.99,13.502L15.49,14.002L0.5,14.002L0,13.502L0.011,1.5ZM15.001,2.999L15.001,4.003L7.501,4.003L7.147,4.15L6.289,5.007L1.011,5.007L1.011,2L6.3,2L7.153,2.853L7.506,2.999L15.001,2.999ZM6.496,6.007L1.011,6.007L1,13.002L14.99,13.002L14.99,5.003L7.708,5.003L6.85,5.861L6.496,6.007Z\"/></svg>",
        "list-error.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M8.004,0.985C11.88,0.985 15.027,4.132 15.027,8.009C15.027,11.885 11.88,15.032 8.004,15.032C4.127,15.032 0.98,11.885 0.98,8.009C0.98,4.132 4.127,0.985 8.004,0.985ZM8,2C11.311,2 14,4.689 14,8C14,11.311 11.311,14 8,14C4.689,14 2,11.311 2,8C2,4.689 4.689,2 8,2ZM8,7.5L10.4,5L11.1,5.7L8.7,8.2L11.1,10.7L10.4,11.4L8,8.9L5.6,11.4L4.9,10.7L7.3,8.2L4.9,5.7L5.6,5L8,7.5Z\"/></svg>",
        "list-file.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M3,1l-1,1l0,12l1,1l9,0l1,-1l0,-9l-0.293,-0.707l-3,-3l-0.707,-0.293l-6,0Zm0,13l0,-12l5,0l0,4l4,0l0,8l-9,0Zm9,-9l-3,-3l0,3l3,0Z\"/></svg>",
        "list-folder.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M1.011,2.5l0.5,-0.5l4.996,0l0.354,0.146l0.852,0.853l6.788,0l0.5,0.5l-0.011,10.003l-0.5,0.5l-12.99,0l-0.5,-0.5l0.011,-11.002Zm12.99,1.499l0,1.004l-6.501,0l-0.353,0.147l-0.858,0.857l-4.278,0l0,-3.007l4.289,0l0.853,0.853l0.353,0.146l6.495,0Zm-7.505,3.008l-4.485,0l-0.011,5.995l11.99,0l0,-6.999l-6.282,0l-0.858,0.858l-0.354,0.146Z\"/></svg>",
        "list-symlink.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><g transform=\"matrix(1,0,0,1,0,-1)\"><path d=\"M12,11L5,11L4,10L4,5L5,5L5,10L12,10L12,11Z\"/></g><g transform=\"matrix(0.707107,-0.707107,0.707107,0.707107,-2.85371,1.22315)\"><rect x=\"4\" y=\"12\" width=\"1\" height=\"4\"/></g><g transform=\"matrix(-0.707107,-0.707107,0.707107,-0.707107,3.51315,24.1437)\"><rect x=\"4\" y=\"12\" width=\"1\" height=\"4\"/></g></svg>",
        "list-unknown.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M11.8,13.831L12.97,13.831L12.97,15.001L11.8,15.001L11.8,13.831ZM10.5,15L3,15L2,14L2,2L3,1L9,1L9.707,1.293L12.707,4.293L13,5L13,7L12,7L12,6L8,6L8,2L3,2L3,14L10.5,14L10.5,15ZM14.05,8.581C14.205,8.737 14.324,8.925 14.4,9.131C14.468,9.348 14.502,9.574 14.5,9.801C14.5,10.019 14.463,10.236 14.39,10.441C14.319,10.635 14.225,10.82 14.11,10.991C14.001,11.159 13.881,11.32 13.75,11.471L13.39,11.911C13.286,12.04 13.192,12.177 13.11,12.321C13.041,12.451 13.003,12.595 13,12.741L13,13.231L11.8,13.231L11.8,12.571C11.796,12.399 11.831,12.229 11.9,12.071C11.973,11.912 12.063,11.761 12.17,11.621C12.28,11.481 12.4,11.341 12.52,11.211L12.87,10.791C12.977,10.648 13.067,10.494 13.14,10.331C13.213,10.174 13.25,10.004 13.25,9.831C13.251,9.728 13.231,9.626 13.19,9.531C13.154,9.447 13.099,9.371 13.03,9.311C12.967,9.25 12.892,9.202 12.81,9.171C12.721,9.157 12.629,9.157 12.54,9.171C12.436,9.165 12.333,9.182 12.236,9.22C11.939,9.349 11.742,9.638 11.73,9.961L10.5,9.961C10.52,9.716 10.571,9.474 10.65,9.241C10.735,9.012 10.864,8.801 11.03,8.621C11.2,8.425 11.411,8.271 11.65,8.171C11.928,8.054 12.228,7.996 12.53,8.001C12.841,7.991 13.151,8.045 13.44,8.161C13.67,8.258 13.877,8.401 14.05,8.581ZM12,5L9,2L9,5L12,5Z\"/></svg>",
        "open-file.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><g transform=\"matrix(1,0,0,1,-1,0)\"><path d=\"M5.914,6L8.06,3.854L8.06,3.146L5.915,1L5.208,1.707L6.501,3L3.501,3C2.13,3 1.001,4.129 1.001,5.5C1.001,6.871 2.13,8 3.501,8L4,8L4,7L3.5,7C2.677,7 2,6.323 2,5.5C2,4.677 2.677,4 3.5,4L6.5,4L5.207,5.293L5.914,6ZM11,2L8.328,2L7.328,1L12,1L12.71,1.29L15.71,4.29L16,5L16,14L15,15L6,15L5,14L5,6.5L6,7.347L6,14L15,14L15,6L11,6L11,2ZM12,2L12,5L15,5L12,2Z\"/></g></svg>",
        "regexp.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><clipPath id=\"_clip1\"><path d=\"M14.301,8.518l-2.772,0.262l2.086,1.788l-1.594,1.392l-1.201,-2.682l-1.201,2.682l-1.583,-1.392l2.075,-1.788l-2.771,-0.262l0.696,-2.126l2.358,1.392l-0.599,-2.784l2.053,0l-0.602,2.783l2.359,-1.392l0.696,2.127Zm-9.301,3.482l3,0l0,3l-3,0l0,-3Z\" clip-rule=\"nonzero\"/></clipPath><g clip-path=\"url(#_clip1)\"><use xlink:href=\"#_Image2\" x=\"5.376\" y=\"5\" width=\"9.301px\" height=\"10px\" transform=\"matrix(0.9301,0,0,1,0,0)\"/></g><defs><image id=\"_Image2\" width=\"10px\" height=\"10px\" xlink:href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA0UlEQVQYlWWP3aqDMBCEP5OV2BRE01YxiO37P5xeB4TpRWno4Swsy/wwu8s8zwJqp5QUQhCgGKPMTNu2iS/Z9301L8vyjwNQ27YC9Hq9qvB4PHS/39V1nZxzH2POWTFGAXXtMAx/JmamcRwVQpCZ1cQYo7quq9iFEHDOUUrhPE9utxvee8yMaZoAyDnD78d932scRwFqmkaAvPefRH7KOcdxHJgZ8zzTti2Xy+Ujfo/ftq0m55yVUqq4aRq5UkpNnKaJ5/PJ9Xpl33fWdcV7jyTeWipfXKZ/Ff8AAAAASUVORK5CYII=\"/></defs></svg>",
        "reveal-file.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M7,2L7,3L3,3L3,13L13,13L13,9L14,9L14,13L13,14L3,14L2,13L2,3L3,2L7,2ZM12.301,2.999L9,2.999L9,1.999L13.501,1.999L14.001,2.499L13.999,7L13.001,7L13.001,3.713L8.707,8.007L8,7.3L12.301,2.999Z\"/></svg>",
        "search-conflict.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M7.56,1L8.44,1L14.98,13.26L14.54,14L1.44,14L1,13.26L7.56,1ZM8,2.28L2.28,13L13.7,13L8,2.28ZM8.625,12L8.625,11L7.375,11L7.375,12L8.625,12ZM7.375,10L7.375,6L8.625,6L8.625,10L7.375,10Z\"/></svg>",
        "search-other.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><g transform=\"matrix(1,0,0,1,0.5,0.596191)\"><path d=\"M7,10.131L8.17,10.131L8.17,11.301L7,11.301L7,10.131ZM9.25,4.881C9.405,5.037 9.524,5.225 9.6,5.431C9.668,5.648 9.702,5.874 9.7,6.101C9.7,6.319 9.663,6.536 9.59,6.741C9.519,6.935 9.425,7.12 9.31,7.291C9.201,7.459 9.081,7.62 8.95,7.771L8.59,8.211C8.486,8.34 8.392,8.477 8.31,8.621C8.241,8.751 8.203,8.895 8.2,9.041L8.2,9.531L7,9.531L7,8.871C6.996,8.699 7.031,8.529 7.1,8.371C7.173,8.212 7.263,8.061 7.37,7.921C7.48,7.781 7.6,7.641 7.72,7.511L8.07,7.091C8.177,6.948 8.267,6.794 8.34,6.631C8.413,6.474 8.45,6.304 8.45,6.131C8.451,6.028 8.431,5.926 8.39,5.831C8.354,5.747 8.299,5.671 8.23,5.611C8.167,5.55 8.092,5.502 8.01,5.471C7.921,5.457 7.829,5.457 7.74,5.471C7.636,5.465 7.533,5.482 7.436,5.52C7.139,5.649 6.942,5.938 6.93,6.261L5.7,6.261C5.72,6.016 5.771,5.774 5.85,5.541C5.935,5.312 6.064,5.101 6.23,4.921C6.4,4.725 6.611,4.571 6.85,4.471C7.128,4.354 7.428,4.296 7.73,4.301C8.041,4.291 8.351,4.345 8.64,4.461C8.87,4.558 9.077,4.701 9.25,4.881Z\"/></g><path d=\"M15.142,7.657L15.142,8.343L8.485,15L7.515,15L1,8.485L1,7.515L7.515,1L8.485,1L15.142,7.657ZM14.071,8L8,1.929L1.929,8L8,14.071L14.071,8Z\"/></svg>",
        "select-all.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><rect x=\"11\" y=\"14\" width=\"8\" height=\"1\"/><rect x=\"11\" y=\"9\" width=\"8\" height=\"1\"/><rect x=\"1\" y=\"9\" width=\"8\" height=\"1\"/><rect x=\"1\" y=\"4\" width=\"8\" height=\"1\"/></svg>",
        "select-deleted.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><rect x=\"11\" y=\"14\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"11\" y=\"9\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"9\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"4\" width=\"8\" height=\"1\"/></svg>",
        "select-modified.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><rect x=\"11\" y=\"14\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"11\" y=\"9\" width=\"8\" height=\"1\"/><rect x=\"1\" y=\"9\" width=\"8\" height=\"1\"/><rect x=\"1\" y=\"4\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/></svg>",
        "select-untracked.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><rect x=\"11\" y=\"14\" width=\"8\" height=\"1\"/><rect x=\"11\" y=\"9\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"9\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"4\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/></svg>",
        "show-deleted.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><rect x=\"11\" y=\"16\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"11\" y=\"11\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"11\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"6\" width=\"8\" height=\"1\"/><rect x=\"1\" y=\"1\" width=\"18\" height=\"1\" style=\"fill-opacity:0.3;\"/></svg>",
        "show-ignored.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><g transform=\"matrix(0.421053,0,0,0.25,-298.474,-27)\"><rect x=\"735\" y=\"172\" width=\"19\" height=\"4\" style=\"fill-opacity:0.3;\"/></g><g transform=\"matrix(0.421053,0,0,0.25,-298.474,-32)\"><rect x=\"735\" y=\"172\" width=\"19\" height=\"4\" style=\"fill-opacity:0.3;\"/></g><g transform=\"matrix(0.421053,0,0,0.25,-308.474,-32)\"><rect x=\"735\" y=\"172\" width=\"19\" height=\"4\" style=\"fill-opacity:0.3;\"/></g><g transform=\"matrix(0.470588,0,0,0.25,-339.235,-36.25)\"><rect x=\"723\" y=\"169\" width=\"17\" height=\"4\" style=\"fill-opacity:0.3;\"/></g><g transform=\"matrix(1.05882,0,0,0.25,-764.529,-41.25)\"><rect x=\"723\" y=\"169\" width=\"17\" height=\"4\" style=\"fill-opacity:0.3;\"/></g></svg>",
        "show-modified.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><rect x=\"11\" y=\"16\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"11\" y=\"11\" width=\"8\" height=\"1\"/><rect x=\"1\" y=\"11\" width=\"8\" height=\"1\"/><rect x=\"1\" y=\"6\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"1\" width=\"18\" height=\"1\" style=\"fill-opacity:0.3;\"/></svg>",
        "show-unchanged.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><rect x=\"11\" y=\"16\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"11\" y=\"11\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"11\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"6\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"1\" width=\"18\" height=\"1\"/></svg>",
        "show-untracked.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><rect x=\"11\" y=\"16\" width=\"8\" height=\"1\"/><rect x=\"11\" y=\"11\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"11\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"6\" width=\"8\" height=\"1\" style=\"fill-opacity:0.3;\"/><rect x=\"1\" y=\"1\" width=\"18\" height=\"1\" style=\"fill-opacity:0.3;\"/></svg>",
        "swap.svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg width=\"20px\" height=\"20px\" viewBox=\"0 0 20 20\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\" xmlns:serif=\"http://www.serif.com/\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><path d=\"M16.072,10l-3.357,3.357l0.618,0.619l3.667,-3.667l0,-0.618l-3.667,-3.667l-0.618,0.619l3.357,3.357Z\"/><path d=\"M3.928,10l3.357,3.357l-0.618,0.619l-3.667,-3.667l0,-0.618l3.667,-3.667l0.618,0.619l-3.357,3.357Z\"/></svg>"
    };

    const findStyleUrl = /url\s*\(\s*"([^"]+)"\s*\)/g;
    window.addEventListener('load', () => {
        detectPlatform();
        detectLanguage();
        initThemeChangeListener();
        document.body.appendChild(document.createElement('l13-diff'));
    });
    clearTimeout(window.l13TimeoutId);
    const vscode = acquireVsCodeApi();
    const msg = new Message(vscode);
    function isMetaKey(ctrlKey, metaKey) {
        return isMacOs && metaKey || !isMacOs && ctrlKey;
    }
    function parseIcons(text) {
        return text.replace(findStyleUrl, (match, url) => {
            const image = icons[url];
            if (image)
                match = `url("data:image/svg+xml;base64,${btoa(image)}")`;
            return match;
        });
    }
    function removeChildren(node) {
        let child;
        while ((child = node.lastChild))
            child.remove();
    }
    function scrollElementIntoView(parent, element) {
        const offsetTop = element.offsetTop;
        const offsetHeight = parent.offsetHeight;
        const scrollTop = parent.scrollTop;
        if (scrollTop > offsetTop) {
            parent.scrollTop = offsetTop;
        }
        else if (scrollTop + offsetHeight < offsetTop + element.offsetHeight) {
            parent.scrollTop = offsetTop + element.offsetHeight - offsetHeight;
        }
    }
    function addButtonActiveStyleEvents(element) {
        element.addEventListener('mousedown', () => element.classList.add('-active'));
        element.addEventListener('mouseup', () => element.classList.remove('-active'));
        element.addEventListener('mouseleave', () => element.classList.remove('-active'));
    }
    function setLabel(element, title) {
        element.setAttribute('aria-label', title);
        element.setAttribute('title', title);
    }
    function disableContextMenu(element) {
        element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            return false;
        });
    }
    function initThemeChangeListener() {
        const observer = new MutationObserver(() => window.dispatchEvent(new CustomEvent('theme', { bubbles: false })));
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    class L13DiffActionsViewModel extends ViewModel {
        constructor() {
            super(...arguments);
            this.selectDisabled = true;
            this.copyDisabled = true;
        }
        disable() {
            this.selectDisabled = true;
            this.copyDisabled = true;
            this.requestUpdate();
        }
        enable() {
            this.selectDisabled = false;
            this.copyDisabled = false;
            this.requestUpdate();
        }
        disableCopy() {
            this.copyDisabled = true;
            this.requestUpdate();
        }
        enableCopy() {
            this.copyDisabled = false;
            this.requestUpdate();
        }
    }

    class L13DiffActionsViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-actions';
            this.vmc = L13DiffActionsViewModel;
        }
    }

    class L13DiffCompareViewModel extends ViewModel {
        constructor() {
            super(...arguments);
            this.disabled = false;
        }
        disable() {
            this.disabled = true;
            this.requestUpdate();
        }
        enable() {
            this.disabled = false;
            this.requestUpdate();
        }
    }

    class L13DiffCompareViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-compare';
            this.vmc = L13DiffCompareViewModel;
        }
    }

    var _a$4;
    const VALUE = Symbol.for('value');
    class L13DiffInputViewModel extends ViewModel {
        constructor() {
            super(...arguments);
            this.disabled = false;
            this[_a$4] = '';
            this.eventName = null;
            this.dialogListener = (data) => {
                if (data.fsPath)
                    this.value = data.fsPath;
                msg.removeMessageListener(this.eventName, this.dialogListener);
                this.eventName = null;
            };
        }
        disable() {
            this.disabled = true;
            this.requestUpdate();
        }
        enable() {
            this.disabled = false;
            this.requestUpdate();
        }
        get value() {
            return this[VALUE];
        }
        set value(val) {
            this[VALUE] = val;
            this.requestUpdate();
        }
        pick(file = false) {
            this.eventName = `dialog:${file ? 'file' : 'folder'}`;
            msg.on(this.eventName, this.dialogListener);
            msg.send(this.eventName);
        }
    }
    _a$4 = VALUE;

    class L13DiffInputViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-input';
            this.vmc = L13DiffInputViewModel;
        }
    }

    var _a$3;
    const parse = JSON.parse;
    const stringify = JSON.stringify;
    const FILTERS = Symbol.for('filters');
    class L13DiffListViewModel extends ViewModel {
        disable() {
            this.disabled = true;
            this.requestUpdate();
        }
        enable() {
            this.disabled = false;
            this.requestUpdate();
        }
        constructor() {
            super();
            this[_a$3] = [];
            this.map = {};
            this.items = [];
            this.filteredItems = [];
            this.diffResult = {
                diffs: [],
                pathA: '',
                pathB: '',
                settings: null,
            };
            this.disabled = false;
            msg.on('create:diffs', (data) => this.createList(data));
            msg.on('copy:left', (data) => this.updateCopiedList(data));
            msg.on('copy:right', (data) => this.updateCopiedList(data));
            msg.on('delete:files', (data) => this.updateDeletedList(data));
            msg.on('remove:files', (data) => this.removeFiles(data.files));
            msg.on('update:files', (data) => this.detectChangedFiles(data.files));
            msg.on('update:diffs', (data) => this.updateDiffList(data));
            msg.on('update:multi', (data) => this.updateMultiList(data));
            msg.on('multi-copy:left', (data) => this.multiCopyFiles('left', data));
            msg.on('multi-copy:right', (data) => this.multiCopyFiles('right', data));
        }
        getDiffById(id) {
            return this.map[id] || null;
        }
        pipe(pipe) {
            this[FILTERS].push(pipe);
            pipe.vm.on('update', () => this.filter());
            return this;
        }
        createList(diffResult) {
            this.enable();
            this.diffResult = diffResult;
            this.map = {};
            this.diffResult.diffs.forEach((diff) => this.map[diff.id] = diff);
            this.items = this.diffResult.diffs;
            this.dispatchEvent('compared');
        }
        updateItems(diffs) {
            const items = this.items = this.items.slice();
            const map = this.map;
            diffs.forEach((diff) => {
                const originalDiff = map[diff.id];
                items.splice(items.indexOf(originalDiff), 1, diff);
                map[diff.id] = diff;
            });
        }
        updateCopiedList(diffResult) {
            const diffs = diffResult.diffs;
            this.updateItems(diffs);
            updateCopiedParentFolders(this.items, diffs);
            this.filter(true);
            this.dispatchEvent('copied');
        }
        updateStatus(items, diffs) {
            const map = this.map;
            diffs.forEach((diff) => {
                const originalDiff = map[diff.id];
                if (diff.fileA || diff.fileB) {
                    if (originalDiff !== diff) {
                        items.splice(items.indexOf(originalDiff), 1, diff);
                        map[diff.id] = diff;
                    }
                    if (diff.status !== 'ignored') {
                        if (!diff.fileA)
                            diff.status = 'untracked';
                        if (!diff.fileB)
                            diff.status = 'deleted';
                    }
                }
                else {
                    items.splice(items.indexOf(originalDiff), 1);
                    delete map[diff.id];
                }
            });
        }
        removeFiles(files) {
            const items = this.items = this.items.slice();
            const diffs = items.filter((diff) => {
                var _b, _c;
                if (files.includes((_b = diff.fileA) === null || _b === void 0 ? void 0 : _b.fsPath)) {
                    diff.fileA = null;
                    return true;
                }
                if (files.includes((_c = diff.fileB) === null || _c === void 0 ? void 0 : _c.fsPath)) {
                    diff.fileB = null;
                    return true;
                }
                return false;
            });
            this.updateStatus(items, diffs);
            updateDeletedSubfiles(items, diffs);
            this.filter(true);
            this.dispatchEvent('removed');
        }
        updateDeletedList(diffResult) {
            const items = this.items = this.items.slice();
            const diffs = diffResult.diffs;
            this.updateStatus(items, diffs);
            updateDeletedSubfiles(items, diffs);
            this.filter(true);
            this.dispatchEvent('deleted');
        }
        detectChangedFiles(files) {
            const diffs = this.items.filter(({ fileA, fileB }) => {
                if (!fileA || !fileB)
                    return false;
                return files.includes(fileA.path) || files.includes(fileB.path);
            });
            if (diffs.length) {
                msg.send('update:diffs', {
                    diffs,
                    pathA: this.diffResult.pathA,
                    pathB: this.diffResult.pathB,
                    settings: this.diffResult.settings,
                });
            }
        }
        updateDiffList(diffResult) {
            this.updateItems(diffResult.diffs);
            this.filter(true);
            this.dispatchEvent('updated');
        }
        updateMultiList(data) {
        }
        swapList() {
            const items = this.items = this.items.slice();
            const diffResult = this.diffResult;
            const pathA = diffResult.pathA;
            diffResult.pathA = diffResult.pathB;
            diffResult.pathB = pathA;
            items.forEach((diff) => {
                const fileA = diff.fileA;
                diff.fileA = diff.fileB;
                diff.fileB = fileA;
                if (diff.status === 'deleted')
                    diff.status = 'untracked';
                else if (diff.status === 'untracked')
                    diff.status = 'deleted';
            });
            this.filter(true);
            this.dispatchEvent('swapped');
        }
        filter(keepPosition) {
            let filteredItems = this.items;
            this[FILTERS].forEach((pipe) => filteredItems = pipe.transform(filteredItems));
            this.filteredItems = filteredItems;
            this.requestUpdate({ keepPosition });
            this.dispatchEvent('filtered');
        }
        getCopyListByIds(ids, from) {
            const items = ids.map((id) => this.map[id]).filter((diff) => from === 'left' && diff.fileA || from === 'right' && diff.fileB);
            return {
                diffs: items,
                multi: false,
                pathA: this.diffResult.pathA,
                pathB: this.diffResult.pathB,
            };
        }
        getGoToListByIds(ids, side) {
            const items = ids.map((id) => this.map[id]);
            const files = [];
            items.forEach((diff) => {
                const file = side === 'left' && diff.fileA || side === 'right' && diff.fileB;
                if (file)
                    files.push(file);
            });
            return files;
        }
        getDiffsByIds(ids) {
            const diffs = ids.map((id) => this.map[id]);
            return {
                diffs,
                pathA: this.diffResult.pathA,
                pathB: this.diffResult.pathB,
                settings: this.diffResult.settings,
            };
        }
        open(ids, openToSide) {
            const diffResult = this.getDiffsByIds(ids);
            if (diffResult.diffs.length)
                msg.send('open:diff', Object.assign(Object.assign({}, diffResult), { openToSide }));
        }
        openPreview(id) {
            const diffResult = this.getDiffsByIds([id]);
            const diff = diffResult.diffs[0];
            if (diff) {
                msg.send('preview:diff', {
                    diff,
                    pathA: diffResult.pathA,
                    pathB: diffResult.pathB,
                });
            }
        }
        copy(ids, from) {
            const diffResult = this.getCopyListByIds(ids, from);
            if (diffResult.diffs.length)
                msg.send(`copy:${from}`, diffResult);
            else
                this.dispatchEvent('cancel');
        }
        multiCopy(ids, from) {
            if (ids.length && this.diffResult.pathA && this.diffResult.pathB) {
                msg.send(`multi-copy:${from}`, {
                    ids,
                    pathA: this.diffResult.pathA,
                    pathB: this.diffResult.pathB,
                });
            }
            else
                this.dispatchEvent('cancel');
        }
        multiCopyFiles(from, data) {
            if (from === 'left' && this.diffResult.pathA === data.pathA
                || from === 'right' && this.diffResult.pathB === data.pathB) {
                const diffCopy = this.getCopyListByIds(data.ids, from);
                if (diffCopy.diffs.length) {
                    diffCopy.multi = true;
                    msg.send(`copy:${from}`, diffCopy);
                    this.dispatchEvent('multicopy');
                }
            }
        }
        goto(ids, side, openToSide) {
            const files = this.getGoToListByIds(ids, side);
            if (files.length)
                msg.send('goto:file', { files, openToSide });
        }
        delete(ids, side = 'both') {
            const diffResult = this.getDiffsByIds(ids);
            if (diffResult.diffs.length)
                msg.send(`delete:${side}`, diffResult);
            else
                this.dispatchEvent('cancel');
        }
    }
    _a$3 = FILTERS;
    function copyDiffFile(diff, copiedDiff, from, to) {
        const fileFrom = `file${from}`;
        const file = diff[fileFrom];
        if (file && copiedDiff[fileFrom].path.startsWith(file.path)) {
            const clone = parse(stringify(file));
            const fileTo = `file${to}`;
            clone.root = copiedDiff[fileTo].root;
            clone.path = clone.root + clone.path.slice(file.root.length);
            diff[fileTo] = clone;
            diff.status = 'unchanged';
            return true;
        }
        return false;
    }
    function updateCopiedParentFolders(diffs, copiedDiffs) {
        diffs.forEach((diff) => {
            if (diff.type === 'folder' && (!diff.fileA || !diff.fileB)) {
                copiedDiffs.some((copiedDiff) => {
                    if (diff.id !== copiedDiff.id && (copiedDiff.status === 'unchanged' || copiedDiff.status === 'ignored')) {
                        if (copyDiffFile(diff, copiedDiff, 'A', 'B'))
                            return true;
                        if (copyDiffFile(diff, copiedDiff, 'B', 'A'))
                            return true;
                    }
                    return false;
                });
            }
        });
    }
    function updateDeletedSubfiles(diffs, deletedDiffs) {
        const deletedFolders = deletedDiffs.filter((diff) => diff.type === 'folder');
        for (const diff of diffs.slice()) {
            loop: for (const deletedDiff of deletedFolders) {
                if (diff.id.startsWith(deletedDiff.id)) {
                    if (!deletedDiff.fileA)
                        diff.fileA = null;
                    if (!deletedDiff.fileB)
                        diff.fileB = null;
                    if (!diff.fileA && !diff.fileB)
                        diffs.splice(diffs.indexOf(diff), 1);
                    else if (diff.status !== 'ignored') {
                        if (!diff.fileA)
                            diff.status = 'untracked';
                        else if (!diff.fileB)
                            diff.status = 'deleted';
                    }
                    break loop;
                }
            }
        }
    }

    class L13DiffListViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-list';
            this.vmc = L13DiffListViewModel;
        }
    }

    var _a$2;
    const LOADING = Symbol.for('loading');
    class L13DiffPanelViewModel extends ViewModel {
        constructor() {
            super(...arguments);
            this[_a$2] = false;
        }
        get loading() {
            return this[LOADING];
        }
        set loading(value) {
            this[LOADING] = value;
            this.requestUpdate();
        }
    }
    _a$2 = LOADING;

    class L13DiffPanelViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-panel';
            this.vmc = L13DiffPanelViewModel;
        }
    }

    var _a$1, _b$1;
    const SEARCHTERM = Symbol.for('searchterm');
    const ERROR = Symbol.for('error');
    class L13DiffSearchViewModel extends ViewModel {
        constructor() {
            super(...arguments);
            this.disabled = false;
            this.useRegExp = false;
            this.useCaseSensitive = false;
            this.useFiles = true;
            this.useFolders = true;
            this.useSymlinks = true;
            this.useConflicts = true;
            this.useOthers = true;
            this[_a$1] = '';
            this[_b$1] = '';
        }
        get searchterm() {
            return this[SEARCHTERM];
        }
        set searchterm(value) {
            this[SEARCHTERM] = value;
            if (!value)
                this.error = null;
            this.requestUpdate();
        }
        get error() {
            return this[ERROR];
        }
        set error(value) {
            this[ERROR] = value;
            this.requestUpdate();
        }
        clearSearchterm() {
            this.searchterm = '';
        }
        disable() {
            this.disabled = true;
            return this.requestUpdate();
        }
        enable() {
            this.disabled = false;
            return this.requestUpdate();
        }
        getState() {
            return {
                searchterm: this.searchterm,
                useRegExp: this.useRegExp,
                useCaseSensitive: this.useCaseSensitive,
                useFiles: this.useFiles,
                useFolders: this.useFolders,
                useSymlinks: this.useSymlinks,
                useConflicts: this.useConflicts,
                useOthers: this.useOthers,
            };
        }
        setState(state) {
            var _c;
            this.searchterm = state.searchterm;
            this.useRegExp = state.useRegExp;
            this.useCaseSensitive = state.useCaseSensitive;
            this.useFiles = state.useFiles;
            this.useFolders = state.useFolders;
            this.useSymlinks = state.useSymlinks;
            this.useConflicts = state.useConflicts;
            this.useOthers = (_c = state.useOthers) !== null && _c !== void 0 ? _c : this.useOthers;
            this.requestUpdate();
        }
    }
    _a$1 = SEARCHTERM, _b$1 = ERROR;

    class L13DiffSearchViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-search';
            this.vmc = L13DiffSearchViewModel;
        }
    }

    class L13DiffSwapViewModel extends ViewModel {
        constructor() {
            super(...arguments);
            this.disabled = false;
        }
        disable() {
            this.disabled = true;
            this.requestUpdate();
        }
        enable() {
            this.disabled = false;
            this.requestUpdate();
        }
    }

    class L13DiffSwapViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-swap';
            this.vmc = L13DiffSwapViewModel;
        }
    }

    class L13DiffViewsViewModel extends ViewModel {
        constructor() {
            super(...arguments);
            this.disabled = false;
            this.unchangedChecked = true;
            this.deletedChecked = true;
            this.modifiedChecked = true;
            this.untrackedChecked = true;
            this.ignoredChecked = false;
        }
        disable() {
            this.disabled = true;
            this.requestUpdate();
        }
        enable() {
            this.disabled = false;
            this.requestUpdate();
        }
        getState() {
            return {
                unchangedChecked: this.unchangedChecked,
                deletedChecked: this.deletedChecked,
                modifiedChecked: this.modifiedChecked,
                untrackedChecked: this.untrackedChecked,
                ignoredChecked: this.ignoredChecked,
            };
        }
        setState(state) {
            this.unchangedChecked = state.unchangedChecked;
            this.deletedChecked = state.deletedChecked;
            this.modifiedChecked = state.modifiedChecked;
            this.untrackedChecked = state.untrackedChecked;
            this.ignoredChecked = state.ignoredChecked;
            this.requestUpdate();
        }
    }

    class L13DiffViewsViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-views';
            this.vmc = L13DiffViewsViewModel;
        }
    }

    const findRegExpChars = /([\\\[\]\.\*\^\$\|\+\-\{\}\(\)\?\!\=\:\,])/g;
    class L13DiffSearchPipe {
        constructor(vm) {
            this.vm = vm;
            this.cache = {
                searchterm: '',
                useRegExp: false,
                useCaseSensitive: false,
                useFiles: true,
                useFolders: true,
                useSymlinks: true,
                useConflicts: true,
                useOthers: true,
                regexp: null,
                items: [],
                filteredItems: [],
            };
        }
        transform(items) {
            const vm = this.vm;
            if (vm.disabled)
                return items;
            const cache = this.cache;
            const searchterm = vm.searchterm;
            const useRegExp = vm.useRegExp;
            const useCaseSensitive = vm.useCaseSensitive;
            const useFiles = vm.useFiles;
            const useFolders = vm.useFolders;
            const useSymlinks = vm.useSymlinks;
            const useConflicts = vm.useConflicts;
            const useOthers = vm.useOthers;
            if (items === cache.items
                && cache.searchterm === searchterm
                && cache.useRegExp === useRegExp
                && cache.useCaseSensitive === useCaseSensitive
                && cache.useFiles === useFiles
                && cache.useFolders === useFolders
                && cache.useSymlinks === useSymlinks
                && cache.useConflicts === useConflicts
                && cache.useOthers === useOthers) {
                return cache.filteredItems;
            }
            let regexp = null;
            try {
                regexp = new RegExp(useRegExp ? searchterm : escapeForRegExp(searchterm), useCaseSensitive ? '' : 'i');
                vm.error = null;
            }
            catch (error) {
                vm.error = error.message;
                return items;
            }
            cache.items = items;
            cache.searchterm = searchterm;
            cache.useRegExp = useRegExp;
            cache.useCaseSensitive = useCaseSensitive;
            cache.useFiles = useFiles;
            cache.useFolders = useFolders;
            cache.useSymlinks = useSymlinks;
            cache.useConflicts = useConflicts;
            cache.useOthers = useOthers;
            return cache.filteredItems = items.filter((diff) => {
                if (useFiles && diff.type === 'file'
                    || useFolders && diff.type === 'folder'
                    || useSymlinks && diff.type === 'symlink'
                    || useConflicts && diff.type === 'mixed'
                    || useOthers && (diff.type === 'error' || diff.type === 'unknown')) {
                    if (!searchterm)
                        return true;
                    const fileA = diff.fileA;
                    const fileB = diff.fileB;
                    return fileA && regexp.test(fileA.name) || fileB && regexp.test(fileB.name);
                }
                return false;
            });
        }
    }
    function escapeForRegExp(text) {
        return `${text}`.replace(findRegExpChars, '\\$1');
    }

    class L13DiffViewsPipe {
        constructor(vm) {
            this.vm = vm;
            this.cache = {
                unchangedChecked: false,
                deletedChecked: true,
                modifiedChecked: true,
                untrackedChecked: true,
                ignoredChecked: false,
                items: [],
                filteredItems: [],
            };
        }
        transform(items) {
            const cache = this.cache;
            const vm = this.vm;
            if (items === cache.items
                && vm.unchangedChecked === cache.unchangedChecked
                && vm.deletedChecked === cache.deletedChecked
                && vm.modifiedChecked === cache.modifiedChecked
                && vm.untrackedChecked === cache.untrackedChecked
                && vm.ignoredChecked === cache.ignoredChecked) {
                return cache.filteredItems;
            }
            cache.items = items;
            cache.unchangedChecked = vm.unchangedChecked;
            cache.deletedChecked = vm.deletedChecked;
            cache.modifiedChecked = vm.modifiedChecked;
            cache.untrackedChecked = vm.untrackedChecked;
            cache.ignoredChecked = vm.ignoredChecked;
            return cache.filteredItems = items.filter((diff) => {
                return vm.unchangedChecked && diff.status === 'unchanged'
                    || vm.deletedChecked && diff.status === 'deleted'
                    || vm.modifiedChecked && (diff.status === 'modified' || diff.status === 'conflicting')
                    || vm.untrackedChecked && diff.status === 'untracked'
                    || vm.ignoredChecked && diff.status === 'ignored';
            });
        }
    }

    var styles = {
        "l13-diff-actions/l13-diff-actions.css": ":host{cursor:default;display:block;text-align:center;user-select:none}:host>button{background:rgba(0,0,0,0);border:0;border-radius:5px;height:26px;margin:0 2px 0 2px;padding:0 0 0 0;position:relative;width:26px}:host>button::before{background:var(--l13-icon-background);content:\"\";height:100%;left:0;-webkit-mask-position:50% 50%;mask-position:50% 50%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;position:absolute;top:0;width:100%}:host>button:focus{outline:solid 1px var(--vscode-focusBorder, transparent)}:host>button:not([disabled]):hover{cursor:pointer;outline:var(--l13-list-hover-outline, none);background-color:var(--l13-button-hover-background)}:host>button:not([disabled]).-active{background-color:var(--l13-button-active-background)}:host>button[disabled]{cursor:default;opacity:.3}:host>button#l13_copy_left{width:46px}:host>button#l13_copy_left::before{-webkit-mask-image:url(\"copy-left.svg\");mask-image:url(\"copy-left.svg\")}:host>button#l13_select_deleted::before{-webkit-mask-image:url(\"select-deleted.svg\");mask-image:url(\"select-deleted.svg\")}:host>button#l13_select_modified::before{-webkit-mask-image:url(\"select-modified.svg\");mask-image:url(\"select-modified.svg\")}:host>button#l13_select_untracked::before{-webkit-mask-image:url(\"select-untracked.svg\");mask-image:url(\"select-untracked.svg\")}:host>button#l13_select_all::before{-webkit-mask-image:url(\"select-all.svg\");mask-image:url(\"select-all.svg\")}:host>button#l13_copy_right{width:46px}:host>button#l13_copy_right::before{-webkit-mask-image:url(\"copy-right.svg\");mask-image:url(\"copy-right.svg\")}",
        "l13-diff-compare/l13-diff-compare.css": ":host{display:block;padding:3px 10px 0 0;text-align:right;user-select:none}button{background:var(--vscode-button-background);border:none;box-sizing:border-box;color:var(--vscode-button-foreground);cursor:pointer;font-size:.8125rem;outline:var(--l13-button-outline, none);padding:2px 14px 3px 14px;position:relative;z-index:1}button:hover{background:var(--vscode-button-hoverBackground)}button:focus{outline:solid 1px var(--vscode-focusBorder, transparent);outline-offset:1px}button[disabled]{opacity:.3;cursor:default}button[disabled]:hover{background:var(--vscode-button-background) !important}",
        "l13-diff-context/l13-diff-context.css": ":host{box-sizing:border-box;line-height:1px;padding:1px 0 0 0;vertical-align:sub;white-space:nowrap}:host button{background:rgba(0,0,0,0);border:none;border-radius:5px;cursor:pointer;display:inline-block;height:22px;margin:-3px 0 0 0;position:relative;width:22px;z-index:1}:host button:not([disabled]):hover{background-color:var(--l13-button-hover-background)}:host button:not([disabled]).-active{background-color:var(--l13-button-active-background)}:host button:not([disabled]).-active::before{background-color:var(--l13-icon-activeBackground)}:host button:disabled{cursor:default;opacity:.3}:host button:focus{outline:solid 1px var(--vscode-focusBorder, transparent)}:host button::before{background-color:var(--l13-icon-background);content:\"\";display:block;height:100%;left:0;-webkit-mask-position:50% 50%;mask-position:50% 50%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;position:absolute;top:0;transition:background-color .1s;width:100%}:host button#copy::before{-webkit-mask-image:url(\"copy-file.svg\");mask-image:url(\"copy-file.svg\")}:host button#goto::before{-webkit-mask-image:url(\"open-file.svg\");mask-image:url(\"open-file.svg\")}:host button#delete::before{-webkit-mask-image:url(\"delete-file.svg\");mask-image:url(\"delete-file.svg\")}:host button#reveal::before{-webkit-mask-image:url(\"reveal-file.svg\");mask-image:url(\"reveal-file.svg\")}",
        "l13-diff-input/l13-diff-input.css": ":host{position:relative;user-select:none}:host>input{background:var(--vscode-input-background);border:none;box-sizing:border-box;color:var(--vscode-input-foreground);display:block;font-size:.8125rem;outline:solid 1px var(--vscode-input-border, transparent);outline-offset:-1px;padding:4px 35px 5px 7px;width:100%;z-index:0}:host>input::selection{color:var(--l13-selection-foreground);background:var(--l13-selection-background)}:host>input:focus{outline-color:var(--vscode-focusBorder, transparent)}:host>input.-error{outline-color:var(--vscode-inputValidation-errorBorder, #cc0000)}:host>button{background:rgba(0,0,0,0);border:0;border-radius:5px;cursor:pointer;height:22px;padding:0 0 0 0;position:absolute;right:4px;top:1px;width:22px}:host>button::before{background:var(--l13-icon-background);content:\"\";height:100%;left:0;-webkit-mask-image:url(\"folder.svg\");mask-image:url(\"folder.svg\");-webkit-mask-position:50% 50%;mask-position:50% 50%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;position:absolute;top:0;width:100%}:host>button:focus{outline:solid 1px var(--vscode-focusBorder, transparent)}:host>button:not([disabled]):hover{background-color:var(--l13-button-hover-background)}:host>button:not([disabled]).-active{background-color:var(--l13-button-active-background)}:host>button[disabled]{cursor:default;opacity:.3}:host>button[disabled]:hover::before{background:var(--l13-icon-background) !important}",
        "l13-diff-intro/l13-diff-intro.css": ":host{background:var(--l13-intro-backgroundUrl) no-repeat;background-size:260px 260px;background-position:50% 0;padding:270px 0 0 0;display:block;min-width:260px;text-align:center;user-select:none}l13-diff-shortcuts{display:inline-table}dl{color:var(--l13-intro-color);cursor:default;display:table-row;opacity:.8}dt{color:var(--l13-intro-color);display:table-cell;letter-spacing:.04em;padding:0 5px 1em 0;text-align:right}dd{display:table-cell;padding:0 0 1em 5px;text-align:left}div.-keybinding{align-items:center;display:flex;line-height:10px}span.-key{background-color:var(--l13-intro-keyBackgroundColor);border:1px solid var(--l13-intro-keyBorderColor);border-bottom-color:var(--l13-intro-shadow);border-radius:3px;box-shadow:inset 0 -1px 0 var(--l13-intro-shadow);color:var(--l13-intro-keyColor);display:inline-block;font-size:11px;line-height:10px;margin:0 2px;padding:3px 5px;vertical-align:middle}",
        "l13-diff-list/l13-diff-list.css": ":host{display:block;overflow:auto;transform:translate3d(0, 0, 0);user-select:none}l13-diff-list-content{display:block;transform:translate3d(0, 0, 0);width:100%}l13-diff-list-content.-focus l13-diff-list-row.-selected{background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground)}l13-diff-list-content.-focus l13-diff-list-row.-selected.-ignored l13-diff-list-file span.-missing{color:var(--vscode-list-activeSelectionForeground)}l13-diff-list-content.-focus l13-diff-list-row.-selected l13-diff-list-file::before{background:var(--vscode-list-activeSelectionForeground, var(--l13-icon-background))}l13-diff-list-content.-focus l13-diff-list-row.-selected l13-diff-list-file span.-exists{color:var(--vscode-list-activeSelectionForeground)}l13-diff-list-content.-drag-n-drop-file l13-diff-list-file.-folder,l13-diff-list-content.-drag-n-drop-file l13-diff-list-file.-symlink{opacity:.3}l13-diff-list-content.-drag-n-drop-folder l13-diff-list-file.-file,l13-diff-list-content.-drag-n-drop-folder l13-diff-list-file.-symlink{opacity:.3}l13-diff-list-content.-drag-n-drop-symlink l13-diff-list-file.-file,l13-diff-list-content.-drag-n-drop-symlink l13-diff-list-file.-folder{opacity:.3}l13-diff-list-row{display:flex;height:22px;position:absolute;left:0;top:0;outline-offset:-1px;width:100%}l13-diff-list-row:hover{background:var(--vscode-list-hoverBackground);color:var(--vscode-list-hoverForeground);outline:var(--l13-list-hover-outline, none)}l13-diff-list-row.-selected{background:var(--vscode-list-inactiveSelectionBackground);color:var(--vscode-list-inactiveSelectionForeground);outline:var(--l13-list-active-outline, none)}l13-diff-list-row.-selected l13-diff-list-file ::before{background:var(--l13-icon-background)}l13-diff-list-row.-deleted{color:var(--vscode-gitDecoration-deletedResourceForeground)}l13-diff-list-row.-modified{color:var(--vscode-gitDecoration-modifiedResourceForeground)}l13-diff-list-row.-unchanged{color:var(--vscode-foreground)}l13-diff-list-row.-unchanged l13-diff-list-file.-folder span.-exists{padding-right:0}l13-diff-list-row.-ignored l13-diff-list-file::before{opacity:.3}l13-diff-list-row.-ignored l13-diff-list-file.-deleted span.-missing{color:var(--vscode-gitDecoration-deletedResourceForeground)}l13-diff-list-row.-ignored l13-diff-list-file.-untracked span.-missing{color:var(--vscode-gitDecoration-untrackedResourceForeground)}l13-diff-list-row.-ignored l13-diff-list-file span.-basename{color:var(--vscode-gitDecoration-ignoredResourceForeground);opacity:.5}l13-diff-list-row.-ignored l13-diff-list-file.-folder span.-missing{padding-right:5px}l13-diff-list-row.-conflicting{color:var(--vscode-gitDecoration-conflictingResourceForeground)}l13-diff-list-row.-untracked{color:var(--vscode-gitDecoration-untrackedResourceForeground)}l13-diff-list-row.-error{background:var(--vscode-list-errorForeground);color:#fff}l13-diff-list-row.-error l13-diff-list-file::before{background:#fff}l13-diff-list-file{box-sizing:border-box;display:flex;justify-content:space-between;overflow:hidden;padding:2px 3px 4px 36px;position:relative;width:calc(50% - 22px)}l13-diff-list-file:first-child{padding-left:31px;padding-right:10px;width:calc(50% + 22px)}l13-diff-list-file:first-child.-error::before,l13-diff-list-file:first-child.-file::before,l13-diff-list-file:first-child.-folder::before,l13-diff-list-file:first-child.-symlink::before,l13-diff-list-file:first-child.-unknown::before{left:10px}l13-diff-list-file.-draghover{background:var(--vscode-list-focusBackground);color:var(--vscode-list-focusForeground)}l13-diff-list-file.-error,l13-diff-list-file.-file,l13-diff-list-file.-folder,l13-diff-list-file.-symlink,l13-diff-list-file.-unknown{cursor:pointer}l13-diff-list-file.-error::before,l13-diff-list-file.-file::before,l13-diff-list-file.-folder::before,l13-diff-list-file.-symlink::before,l13-diff-list-file.-unknown::before{background:var(--l13-icon-background);content:\"\";display:block;height:16px;left:15px;-webkit-mask-position:50% 50%;mask-position:50% 50%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;position:absolute;top:2px;width:16px}l13-diff-list-file.-error::before{-webkit-mask-image:url(\"list-error.svg\");mask-image:url(\"list-error.svg\")}l13-diff-list-file.-file::before{-webkit-mask-image:url(\"list-file.svg\");mask-image:url(\"list-file.svg\")}l13-diff-list-file.-folder::before{-webkit-mask-image:url(\"list-folder.svg\");mask-image:url(\"list-folder.svg\")}l13-diff-list-file.-folder span.-basename{opacity:.7}l13-diff-list-file.-folder span.-missing{padding-right:0}l13-diff-list-file.-symlink::before{-webkit-mask-image:url(\"list-symlink.svg\");mask-image:url(\"list-symlink.svg\")}l13-diff-list-file.-unknown::before{-webkit-mask-image:url(\"list-unknown.svg\");mask-image:url(\"list-unknown.svg\")}l13-diff-list-file div.-path{overflow:hidden;text-overflow:ellipsis;white-space:pre}l13-diff-list-file span.-exists{color:var(--vscode-foreground);opacity:.7;padding-right:5px}l13-diff-list-file span.-missing{opacity:.7;padding-right:5px}l13-diff-list-file span.-info{color:var(--vscode-foreground);font-size:11px;opacity:.5;padding-left:5px}",
        "l13-diff-menu/l13-diff-menu.css": ":host{background:var(--vscode-editorWidget-background);box-shadow:0px 5px 8px var(--vscode-widget-shadow, transparent);box-sizing:border-box;display:block}:host>l13-diff-menu-lists>ul{border-top:solid 1px var(--vscode-pickerGroup-border);list-style-type:none;margin:0 0 0 0;padding:0 0 0 0}:host>l13-diff-menu-lists>ul:first-child{border:none}:host>l13-diff-menu-lists>ul>li{color:var(--vscode-foreground);cursor:pointer;display:flex;justify-content:space-between;margin:0 0 0 0;padding:4px 10px 5px 10px;user-select:none}:host>l13-diff-menu-lists>ul>li.-active,:host>l13-diff-menu-lists>ul>li.-selected{background:var(--vscode-list-focusBackground);color:var(--vscode-list-focusForeground)}:host>l13-diff-menu-lists>ul>li:hover{background:var(--vscode-list-hoverBackground);color:var(--vscode-list-hoverForeground)}:host>l13-diff-menu-lists>ul>li div.-path{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}:host>l13-diff-menu-lists>ul>li div.-info{color:var(--vscode-pickerGroup-foreground);padding-left:10px;text-align:right;white-space:nowrap}",
        "l13-diff-navigator/l13-diff-navigator.css": ":host{display:block;position:relative;transform:translate3d(0, 0, 0);user-select:none}div{background-color:var(--vscode-scrollbarSlider-background);box-sizing:border-box;height:10;position:absolute;right:0;top:0;transform:translate3d(0, 0, 0);width:30px;z-index:1}div:hover{background-color:var(--vscode-scrollbarSlider-hoverBackground)}div:active{background-color:var(--vscode-scrollbarSlider-activeBackground)}#ruler{display:block;position:absolute;right:30px;top:0;z-index:0}#map{display:block;opacity:.7;position:absolute;right:0;top:0;z-index:0}",
        "l13-diff-panel/l13-diff-panel.css": ":host{background:var(--vscode-sideBar-background);color:var(--vscode-foreground);display:block;position:relative;width:100%}l13-diff-loading{bottom:0;display:block;height:2px;left:0;overflow:hidden;position:absolute;right:0;width:100%;z-index:4}l13-diff-loading::after{animation:loading 4s linear infinite;background:linear-gradient(90deg, transparent 0%, var(--vscode-progressBar-background) 20%, var(--vscode-progressBar-background) 80%, transparent 100%) no-repeat;bottom:0;content:\"\";height:2px;position:absolute;left:0;width:5%}@keyframes loading{0%{left:0;width:3%}50%{width:8%}100%{left:100%;width:3%}}",
        "l13-diff-search/l13-diff-search.css": ":host{background:var(--vscode-editorWidget-background);box-shadow:0 2px 8px var(--vscode-widget-shadow);box-sizing:border-box;display:block;height:34px;max-width:calc(100% - 38px);min-width:364px;padding:4px 4px 5px 8px;position:relative;user-select:none;width:364px}#l13_resizer{background:var(--vscode-editorWidget-resizeBorder, var(--l13-searchWidget-borderColor));cursor:col-resize;display:block;height:100%;left:0;position:absolute;top:0;width:3px}div.l13-input{margin:0 154px 0 0;position:relative}div.l13-message{background:var(--vscode-inputValidation-errorBackground);box-sizing:border-box;border:solid 1px var(--vscode-inputValidation-errorBorder);color:var(--vscode-inputValidation-errorForeground);font-size:12px;line-height:17px;margin:-1px 0 0 0;padding:.4em .4em .4em .4em;width:100%}input[type=text]{background:var(--vscode-input-background);border:none;box-sizing:border-box;color:var(--vscode-input-foreground);display:block;font-size:.8125rem;height:25px;outline:solid 1px var(--vscode-input-border, transparent);outline-offset:-1px;margin:0 0 0 0;padding:4px 46px 5px 7px;width:100%;z-index:0}input[type=text]::selection{color:var(--l13-selection-foreground);background:var(--l13-selection-background)}input[type=text]:focus{outline-color:var(--vscode-focusBorder, transparent)}input[type=text].-error{outline-color:var(--vscode-inputValidation-errorBorder)}input[type=checkbox]{-webkit-appearance:none;appearance:none;border-radius:3px;box-sizing:border-box;cursor:pointer;display:inline-block;height:20px;margin:0 0 0 0;opacity:.7;outline:solid 1px rgba(0,0,0,0);outline-offset:-1px;padding:0 0 0 0;position:absolute;top:3px;width:20px}input[type=checkbox]:hover{opacity:1}input[type=checkbox]:focus{outline-color:var(--vscode-focusBorder, transparent);opacity:1}input[type=checkbox]::after{background:var(--l13-icon-background);content:\"\";height:100%;left:0;-webkit-mask-position:50% 50%;mask-position:50% 50%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;opacity:.7;position:absolute;top:0;width:100%}input[type=checkbox]#l13_case_sensitive{right:27px}input[type=checkbox]#l13_case_sensitive:hover{outline:var(--l13-list-hover-outline, none)}input[type=checkbox]#l13_case_sensitive::after{-webkit-mask-image:url(\"case-sensitive.svg\");mask-image:url(\"case-sensitive.svg\")}input[type=checkbox]#l13_use_regexp{right:5px}input[type=checkbox]#l13_use_regexp:hover{outline:var(--l13-list-hover-outline, none)}input[type=checkbox]#l13_use_regexp::after{-webkit-mask-image:url(\"regexp.svg\");mask-image:url(\"regexp.svg\")}input[type=checkbox].-option{height:22px;top:6px;width:22px}input[type=checkbox]#l13_use_files{right:132px}input[type=checkbox]#l13_use_files::after{-webkit-mask-image:url(\"list-file.svg\");mask-image:url(\"list-file.svg\");left:1px}input[type=checkbox]#l13_use_folders{right:106px}input[type=checkbox]#l13_use_folders::after{-webkit-mask-image:url(\"list-folder.svg\");mask-image:url(\"list-folder.svg\")}input[type=checkbox]#l13_use_symlinks{right:80px}input[type=checkbox]#l13_use_symlinks::after{-webkit-mask-image:url(\"list-symlink.svg\");mask-image:url(\"list-symlink.svg\")}input[type=checkbox]#l13_use_conflicts{right:54px}input[type=checkbox]#l13_use_conflicts::after{-webkit-mask-image:url(\"search-conflict.svg\");mask-image:url(\"search-conflict.svg\")}input[type=checkbox]#l13_use_others{right:28px}input[type=checkbox]#l13_use_others::after{-webkit-mask-image:url(\"search-other.svg\");mask-image:url(\"search-other.svg\")}input[type=checkbox]:checked{background:var(--vscode-inputOption-activeBackground, transparent);outline-color:var(--vscode-inputOption-activeBorder)}input[type=checkbox]:checked::after{opacity:1}button{background:rgba(0,0,0,0);border:0;height:20px;margin:0 0 0 0;padding:0 0 0 0;position:absolute;right:4px;top:7px;width:20px}button::before{background:var(--l13-icon-background);content:\"\";height:100%;left:0;-webkit-mask-position:50% 50%;mask-position:50% 50%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;position:absolute;top:0;width:100%}button:focus{outline:solid 1px var(--vscode-focusBorder, transparent)}button:hover{background:var(--l13-searchButton-backgroundColor-hover);cursor:pointer}button[disabled]{opacity:.3;cursor:default}button[disabled]:hover::before{background:var(--l13-icon-background) !important}button#l13_close:hover{outline:var(--l13-list-hover-outline, none)}button#l13_close::before{-webkit-mask-image:url(\"close.svg\");mask-image:url(\"close.svg\")}",
        "l13-diff-swap/l13-diff-swap.css": ":host{display:block;user-select:none}:host>button{background:rgba(0,0,0,0);border:0;border-radius:5px;cursor:pointer;height:22px;margin:2px 0 0 0;padding:0 0 0 0;position:relative;width:22px}:host>button::before{background:var(--l13-icon-background);content:\"\";height:100%;left:0;-webkit-mask-image:url(\"swap.svg\");mask-image:url(\"swap.svg\");-webkit-mask-position:50% 50%;mask-position:50% 50%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;position:absolute;top:0;width:100%}:host>button:focus{outline:solid 1px var(--vscode-focusBorder, transparent)}:host>button:not([disabled]):hover{background-color:var(--l13-button-hover-background);outline:var(--l13-list-hover-outline, none)}:host>button:not([disabled]).-active{background-color:var(--l13-button-active-background)}:host>button[disabled]{cursor:default;opacity:.3}:host>button[disabled]:hover::before{background:var(--l13-icon-background) !important}",
        "l13-diff-views/l13-diff-views.css": ":host{cursor:default;display:block;padding-left:10px;user-select:none}:host>input[type=checkbox]{-webkit-appearance:none;appearance:none;background:rgba(0,0,0,0);border-radius:5px;cursor:pointer;height:26px;margin:0 4px 0 0;padding:0 0 0 0;position:relative;width:26px}:host>input[type=checkbox]::before{background:var(--l13-icon-background);content:\"\";height:100%;left:0;-webkit-mask-position:50% 50%;mask-position:50% 50%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;position:absolute;top:0;width:100%}:host>input[type=checkbox]:focus{outline:solid 1px var(--vscode-focusBorder, transparent)}:host>input[type=checkbox]:not([disabled]):hover{cursor:pointer;outline:var(--l13-list-hover-outline, none);background-color:var(--l13-button-hover-background)}:host>input[type=checkbox]:not([disabled]).-active{background-color:var(--l13-button-active-background)}:host>input[type=checkbox][disabled]{opacity:.3;cursor:default}:host>input[type=checkbox]:checked::after{background:var(--vscode-inputOption-activeBorder);content:\"\";height:2px;left:4px;position:absolute;bottom:0;width:18px}:host>input[type=checkbox]#l13_show_unchanged::before{-webkit-mask-image:url(\"show-unchanged.svg\");mask-image:url(\"show-unchanged.svg\")}:host>input[type=checkbox]#l13_show_deleted::before{-webkit-mask-image:url(\"show-deleted.svg\");mask-image:url(\"show-deleted.svg\")}:host>input[type=checkbox]#l13_show_modified::before{-webkit-mask-image:url(\"show-modified.svg\");mask-image:url(\"show-modified.svg\")}:host>input[type=checkbox]#l13_show_untracked::before{-webkit-mask-image:url(\"show-untracked.svg\");mask-image:url(\"show-untracked.svg\")}:host>input[type=checkbox]#l13_show_ignored::before{-webkit-mask-image:url(\"show-ignored.svg\");mask-image:url(\"show-ignored.svg\")}",
        "l13-diff/l13-diff.css": ":host{display:flex;font-size:.8125rem;flex-direction:column;height:100%;max-height:100%;min-width:610px;position:relative}l13-diff-panel{background:var(--vscode-sideBar-background);position:relative;z-index:2}l13-diff-folders{background:var(--vscode-sideBar-background);display:flex;position:relative;z-index:4}l13-diff-input{box-sizing:border-box;margin:10px 10px 0 15px;position:relative;width:50%;z-index:3}l13-diff-input:first-child{margin:10px 15px 0 10px}l13-diff-menu{max-height:50vh;overflow:auto;position:absolute;width:100%;z-index:5}l13-diff-swap{left:calc(50% - 11px);position:absolute;top:9px;z-index:3}l13-diff-tools{background:var(--vscode-sideBar-background);display:flex;padding:7px 0 4px 0;position:relative;z-index:3}l13-diff-views,l13-diff-compare{min-width:175px;width:25%}l13-diff-actions{min-width:240px;width:50%}l13-diff-widgets{display:block;position:relative;z-index:2}l13-diff-search{position:absolute;right:28px;top:0}l13-diff-search.-movein{animation:movein .1s linear}l13-diff-search.-moveout{animation:moveout .1s linear}@keyframes movein{0%{top:-42px}100%{top:0}}@keyframes moveout{0%{top:0}100%{top:-42px}}l13-diff-list{position:relative;margin:0 30px 0 0;z-index:1}l13-diff-list:focus{outline:solid 1px var(--vscode-focusBorder, transparent);outline-offset:-1px}l13-diff-list.-widgets{margin-top:34px}l13-diff-list.-active{pointer-events:none}l13-diff-list.-active::-webkit-scrollbar-thumb{background-color:var(--vscode-scrollbarSlider-activeBackground)}l13-diff-navigator{position:absolute;right:0;top:75px;width:44px;z-index:0}l13-diff-navigator.-widgets{margin-top:34px}l13-diff-intro{left:50%;position:absolute;top:50%;transform:translate(-50%, calc(-50% + 20px));user-select:none}l13-diff-no-result{display:block;left:50%;opacity:.7;position:absolute;top:50%;text-align:center;transform:translate(-50%, calc(-50% + 20px));user-select:none}::-webkit-scrollbar{height:14px;width:14px}::-webkit-scrollbar-thumb{background-color:var(--vscode-scrollbarSlider-background)}::-webkit-scrollbar-thumb:hover{background-color:var(--vscode-scrollbarSlider-hoverBackground)}::-webkit-scrollbar-thumb:active{background-color:var(--vscode-scrollbarSlider-activeBackground)}::-webkit-scrollbar-corner{background-color:rgba(0,0,0,0)}"
    };

    var templates = {
        "l13-diff-actions/l13-diff-actions.html": "<button id=\"l13_copy_right\" [disabled]=\"copyDisabled\"></button>\r\n<button id=\"l13_select_deleted\" [disabled]=\"selectDisabled\"></button>\r\n<button id=\"l13_select_modified\" [disabled]=\"selectDisabled\"></button>\r\n<button id=\"l13_select_untracked\" [disabled]=\"selectDisabled\"></button>\r\n<button id=\"l13_select_all\" [disabled]=\"selectDisabled\"></button>\r\n<button id=\"l13_copy_left\" [disabled]=\"copyDisabled\"></button>",
        "l13-diff-compare/l13-diff-compare.html": "<button [disabled]=\"disabled\">Compare</button>\r\n<button [disabled]=\"disabled\">Accept Merge</button>\r\n<button [disabled]=\"disabled\">Cancel Merge</button>",
        "l13-diff-context/l13-diff-context.html": "<button id=\"copy\" [disabled]=\"copyDisabled\"></button><button id=\"goto\" [disabled]=\"gotoDisabled\"></button><button id=\"reveal\" [disabled]=\"revealDisabled\"></button><button id=\"delete\" [disabled]=\"deleteDisabled\"></button>",
        "l13-diff-input/l13-diff-input.html": "<input type=\"text\" [(model)]=\"value\" [disabled]=\"disabled\">\r\n<button [disabled]=\"disabled\"></button>\r\n<slot></slot>",
        "l13-diff-intro/l13-diff-intro.html": "<l13-diff-shortcuts></l13-diff-shortcuts>",
        "l13-diff-list/l13-diff-list.html": "<l13-diff-list-content></l13-diff-list-content>",
        "l13-diff-menu/l13-diff-menu.html": "<l13-diff-menu-lists></l13-diff-menu-lists>",
        "l13-diff-navigator/l13-diff-navigator.html": "<canvas id=\"ruler\"></canvas><canvas id=\"map\"></canvas><div></div>",
        "l13-diff-panel/l13-diff-panel.html": "<l13-diff-loading [if]=\"loading\"></l13-diff-loading>\r\n<slot></slot>",
        "l13-diff-search/l13-diff-search.html": "<div id=\"l13_resizer\"></div>\r\n<div class=\"l13-input\">\r\n\t<input id=\"l13_searchterm\" type=\"text\" [(model)]=\"searchterm\" [disabled]=\"disabled\">\r\n\t<input id=\"l13_case_sensitive\" type=\"checkbox\" [(model)]=\"useCaseSensitive\" [disabled]=\"disabled\">\r\n\t<input id=\"l13_use_regexp\" type=\"checkbox\" [(model)]=\"useRegExp\" [disabled]=\"disabled\">\r\n\t<div class=\"l13-message\" [if]=\"error\">{{ error }}</div>\r\n</div>\r\n<input id=\"l13_use_files\" class=\"-option\" type=\"checkbox\" [(model)]=\"useFiles\" [disabled]=\"disabled\">\r\n<input id=\"l13_use_folders\" class=\"-option\" type=\"checkbox\" [(model)]=\"useFolders\" [disabled]=\"disabled\">\r\n<input id=\"l13_use_symlinks\" class=\"-option\" type=\"checkbox\" [(model)]=\"useSymlinks\" [disabled]=\"disabled\">\r\n<input id=\"l13_use_conflicts\" class=\"-option\" type=\"checkbox\" [(model)]=\"useConflicts\" [disabled]=\"disabled\">\r\n<input id=\"l13_use_others\" class=\"-option\" type=\"checkbox\" [(model)]=\"useOthers\" [disabled]=\"disabled\">\r\n<button id=\"l13_close\" [disabled]=\"disabled\"></button>",
        "l13-diff-swap/l13-diff-swap.html": "<button [disabled]=\"disabled\"></button>",
        "l13-diff-views/l13-diff-views.html": "<input id=\"l13_show_unchanged\" type=\"checkbox\" [(model)]=\"unchangedChecked\" [disabled]=\"disabled\">\r\n<input id=\"l13_show_deleted\" type=\"checkbox\" [(model)]=\"deletedChecked\" [disabled]=\"disabled\">\r\n<input id=\"l13_show_modified\" type=\"checkbox\" [(model)]=\"modifiedChecked\" [disabled]=\"disabled\">\r\n<input id=\"l13_show_untracked\" type=\"checkbox\" [(model)]=\"untrackedChecked\" [disabled]=\"disabled\">\r\n<input id=\"l13_show_ignored\" type=\"checkbox\" [(model)]=\"ignoredChecked\" [disabled]=\"disabled\">",
        "l13-diff/l13-diff.html": "<l13-diff-panel vmId=\"panel\">\r\n\t<l13-diff-folders>\r\n\t\t<l13-diff-input vmId=\"left\" id=\"left\" placeholder=\"Left file or folder\"></l13-diff-input>\r\n\t\t<l13-diff-swap vmId=\"swap\"></l13-diff-swap>\r\n\t\t<l13-diff-input vmId=\"right\" id=\"right\" placeholder=\"Right file or folder\"></l13-diff-input>\r\n\t</l13-diff-folders>\r\n\t<l13-diff-tools>\r\n\t\t<!-- <l13-diff-views vmId=\"views\"></l13-diff-views> -->\r\n\t\t<l13-diff-actions vmId=\"actions\"></l13-diff-actions>\r\n\t\t<l13-diff-compare vmId=\"compare\"></l13-diff-compare>\r\n\t</l13-diff-tools>\r\n\t<l13-diff-widgets></l13-diff-widgets>\r\n</l13-diff-panel>\r\n<l13-diff-list vmId=\"list\"></l13-diff-list>\r\n<l13-diff-navigator vmId=\"navigator\"></l13-diff-navigator>\r\n<l13-diff-intro></l13-diff-intro>\r\n<l13-diff-no-result>No items are matching the current filter settings.</l13-diff-no-result>"
    };

    function init$j({ list }) {
        msg.on('l13Diff.action.actions.copyToLeftFolder', () => list.copy('right'));
        msg.on('l13Diff.action.actions.copyToRightFolder', () => list.copy('left'));
        msg.on('l13Diff.action.actions.selectAllEntries', () => {
            list.selectAll();
            list.focus();
        });
        msg.on('l13Diff.action.actions.selectCreatedEntries', () => list.selectByStatus('untracked'));
        msg.on('l13Diff.action.actions.selectDeletedEntries', () => list.selectByStatus('deleted'));
        msg.on('l13Diff.action.actions.selectModifiedEntries', () => list.selectByStatus('modified'));
    }

    function init$i({ diff, left, right, search }) {
        msg.on('l13Diff.action.panel.compare', () => {
            if (!left.focused && !right.focused && !search.focused)
                diff.initCompare();
        });
        msg.on('l13Diff.action.panel.compareAll', () => {
            if (!left.focused && !right.focused && !search.focused)
                msg.send('compare:multi');
        });
    }

    function init$h({ leftVM, rightVM }) {
        msg.on('l13Diff.action.panel.addToFavorites', () => {
            msg.send('save:favorite', {
                pathA: leftVM.value,
                pathB: rightVM.value,
            });
        });
    }

    function init$g({ leftVM, rightVM }) {
        msg.on('l13Diff.action.input.pickLeftFolder', () => leftVM.pick());
        msg.on('l13Diff.action.input.pickLeftFile', () => leftVM.pick(true));
        msg.on('l13Diff.action.input.pickRightFolder', () => rightVM.pick());
        msg.on('l13Diff.action.input.pickRightFile', () => rightVM.pick(true));
    }

    function init$f({ diff, list, search }) {
        msg.on('l13Diff.action.list.delete', () => {
            if (list.disabled)
                return;
            diff.disable();
            list.delete();
        });
        msg.on('l13Diff.action.list.unselect', () => {
            if (!search.focused)
                list.unselect();
        });
    }

    function init$e({ menu }) {
        msg.on('l13Diff.action.menu.close', () => {
            if (menu && menu.parentNode)
                menu.remove();
        });
    }

    function init$d({ search, searchVM, widgets }) {
        msg.on('l13Diff.action.search.open', () => {
            if (!search.parentNode) {
                search.classList.add('-movein');
                widgets.appendChild(search);
            }
            else
                search.focus();
        });
        msg.on('l13Diff.action.search.close', () => search.close());
        msg.on('l13Diff.action.search.toggleFindCaseSensitive', () => {
            searchVM.useCaseSensitive = !searchVM.useCaseSensitive;
            searchVM.requestUpdate();
        });
        msg.on('l13Diff.action.search.toggleFindRegularExpression', () => {
            searchVM.useRegExp = !searchVM.useRegExp;
            searchVM.requestUpdate();
        });
        msg.on('l13Diff.action.search.toggleFindFiles', () => {
            searchVM.useFiles = !searchVM.useFiles;
            searchVM.requestUpdate();
        });
        msg.on('l13Diff.action.search.toggleFindFolders', () => {
            searchVM.useFolders = !searchVM.useFolders;
            searchVM.requestUpdate();
        });
        msg.on('l13Diff.action.search.toggleFindSymbolicLinks', () => {
            searchVM.useSymlinks = !searchVM.useSymlinks;
            searchVM.requestUpdate();
        });
        msg.on('l13Diff.action.search.toggleFindConflicts', () => {
            searchVM.useConflicts = !searchVM.useConflicts;
            searchVM.requestUpdate();
        });
        msg.on('l13Diff.action.search.toggleFindOthers', () => {
            searchVM.useOthers = !searchVM.useOthers;
            searchVM.requestUpdate();
        });
    }

    function init$c({ diff }) {
        msg.on('l13Diff.action.inputs.swap', () => diff.swapInputs());
        msg.on('l13Diff.action.inputs.swapAll', () => diff.swapInputs(true));
    }

    function init$b({ viewsVM }) {
        msg.on('l13Diff.action.views.toggleShowAllCreated', () => {
            viewsVM.untrackedChecked = !viewsVM.untrackedChecked;
            viewsVM.requestUpdate();
        });
        msg.on('l13Diff.action.views.toggleShowAllDeleted', () => {
            viewsVM.deletedChecked = !viewsVM.deletedChecked;
            viewsVM.requestUpdate();
        });
        msg.on('l13Diff.action.views.toggleShowAllIgnored', () => {
            viewsVM.ignoredChecked = !viewsVM.ignoredChecked;
            viewsVM.requestUpdate();
        });
        msg.on('l13Diff.action.views.toggleShowAllModified', () => {
            viewsVM.modifiedChecked = !viewsVM.modifiedChecked;
            viewsVM.requestUpdate();
        });
        msg.on('l13Diff.action.views.toggleShowAllUnchanged', () => {
            viewsVM.unchangedChecked = !viewsVM.unchangedChecked;
            viewsVM.requestUpdate();
        });
    }

    function init$a({ diff, actions, list }) {
        actions.addEventListener('select', (event) => {
            const { metaKey, ctrlKey, status } = event.detail;
            if (status)
                list.selectByStatus(status, isMetaKey(ctrlKey, metaKey));
            else
                list.selectAll();
        });
        actions.addEventListener('copy', (event) => {
            const detail = event.detail;
            diff.disable();
            if (detail.altKey)
                list.multiCopy(detail.from);
            else
                list.copy(detail.from);
        });
    }

    function init$9({ diff, compare }) {
        compare.addEventListener('compare', (event) => {
            if (event.detail.altKey)
                msg.send('compare:multi');
            else
                diff.initCompare();
        });
        msg.on('compare:multi', () => diff.initCompare());
    }

    function init$8({ diff, leftVM, rightVM }) {
        msg.on('cancel', () => diff.enable());
        msg.on('update:paths', (data) => {
            var _a, _b;
            if (data.uris.length) {
                leftVM.value = ((_a = data.uris[0]) === null || _a === void 0 ? void 0 : _a.fsPath) || '';
                rightVM.value = ((_b = data.uris[1]) === null || _b === void 0 ? void 0 : _b.fsPath) || '';
                if (data.compare)
                    diff.initCompare();
            }
        });
        msg.on('init:view', (data) => {
            var _a, _b;
            msg.removeMessageListener('init:view');
            diff.initPanelStates(data.panel);
            if (data.uris.length) {
                leftVM.value = ((_a = data.uris[0]) === null || _a === void 0 ? void 0 : _a.fsPath) || '';
                rightVM.value = ((_b = data.uris[1]) === null || _b === void 0 ? void 0 : _b.fsPath) || '';
            }
            else {
                leftVM.value = data.workspaces[0] || '';
                rightVM.value = data.workspaces[1] || '';
            }
            if (data.compare)
                diff.initCompare();
        });
        msg.send('init:view');
    }

    function init$7({ diff, left, right, menu }) {
        left.menu = menu;
        right.menu = menu;
        left.addEventListener('compare', () => diff.initCompare());
        right.addEventListener('compare', () => diff.initCompare());
    }

    function init$6({ diff, list, listVM, navigator, actionsVM, result, intro }) {
        listVM.on('cancel', () => diff.enable());
        listVM.on('compared', () => diff.enable());
        listVM.on('copied', () => diff.enable());
        listVM.on('deleted', () => diff.enable());
        listVM.on('multicopy', () => diff.disable());
        listVM.on('filtered', () => {
            result.style.display = listVM.items.length && !listVM.filteredItems.length ? 'block' : 'none';
            intro.style.display = listVM.items.length ? 'none' : 'block';
        });
        list.addEventListener('copy', () => diff.disable());
        list.addEventListener('delete', () => diff.disable());
        list.addEventListener('selected', () => {
            actionsVM.enableCopy();
            diff.updateNavigator(false, true);
        });
        list.addEventListener('unselected', () => {
            actionsVM.disableCopy();
            navigator.clearSelection();
        });
        list.addEventListener('scroll', (event) => {
            event.stopImmediatePropagation();
            diff.updateScrollbarPosition();
            list.showVisibleListViewItems();
        });
        list.addEventListener('filtered', () => diff.updateNavigator(true, false));
    }

    const { floor: floor$1 } = Math;
    function init$5({ navigator, list }) {
        navigator.addEventListener('mousemovescroll', (event) => {
            const scrollbarY = event.detail.y;
            const scrollbarHeight = event.detail.height;
            const canvasHeight = navigator.canvasMap.offsetHeight;
            const listScrollHeight = list.scrollHeight;
            if (scrollbarY + scrollbarHeight === canvasHeight) {
                list.scrollTop = listScrollHeight;
            }
            else {
                list.scrollTop = floor$1(scrollbarY / canvasHeight * listScrollHeight);
            }
        });
        navigator.addEventListener('mousedownscroll', () => list.classList.add('-active'));
        navigator.addEventListener('mouseupscroll', () => list.classList.remove('-active'));
    }

    function init$4({ diff, list, navigator, search }) {
        search.addEventListener('close', () => {
            search.classList.add('-moveout');
        });
        search.addEventListener('animationend', () => __awaiter(this, void 0, void 0, function* () {
            if (search.classList.contains('-moveout')) {
                list.classList.remove('-widgets');
                navigator.classList.remove('-widgets');
                search.classList.remove('-moveout');
                search.viewmodel.disable();
                search.remove();
                list.focus();
            }
            else {
                list.classList.add('-widgets');
                navigator.classList.add('-widgets');
                search.classList.remove('-movein');
                yield search.viewmodel.enable();
                search.focus();
            }
            diff.updateNavigator();
        }));
    }

    function init$3({ diff, swap }) {
        swap.addEventListener('swap', ({ detail }) => diff.swapInputs(detail.altKey));
    }

    function init$2({ diff, list, left, right, search }) {
        document.addEventListener('mouseup', ({ target }) => {
            if (list.disabled)
                return;
            if (target === document.body || target === document.documentElement)
                list.unselect();
        });
        window.addEventListener('theme', () => diff.updateNavigator());
        window.addEventListener('resize', () => {
            list.showVisibleListViewItems(true);
            diff.updateNavigator();
        });
        window.addEventListener('focus', () => {
            if (list.content.firstElementChild && !left.focused && !right.focused && !search.focused) {
                setTimeout(() => {
                    if (!left.focused && !right.focused && !search.focused)
                        list.focus();
                }, 0);
            }
        });
    }

    class L13DiffViewModel extends ViewModel {
    }

    class L13DiffViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff';
            this.vmc = L13DiffViewModel;
        }
    }

    const actionsVM = new L13DiffActionsViewModelService().model('actions');
    const compareVM = new L13DiffCompareViewModelService().model('compare');
    const leftVM = new L13DiffInputViewModelService().model('left');
    const listVM = new L13DiffListViewModelService().model('list');
    const panelVM = new L13DiffPanelViewModelService().model('panel');
    const rightVM = new L13DiffInputViewModelService().model('right');
    const searchVM = new L13DiffSearchViewModelService().model('search');
    const swapVM = new L13DiffSwapViewModelService().model('swap');
    const viewsVM = new L13DiffViewsViewModelService().model('views');
    listVM.pipe(new L13DiffViewsPipe(viewsVM))
        .pipe(new L13DiffSearchPipe(searchVM));
    let L13DiffComponent = class L13DiffComponent extends L13Element {
        constructor() {
            super();
            this.menu = document.createElement('l13-diff-menu');
            this.menu.vmId = 'menu';
            this.search = document.createElement('l13-diff-search');
            this.search.vmId = 'search';
            searchVM.disable();
            this.initCommandsAndEvents();
        }
        initCommandsAndEvents() {
            const diff = this;
            const actions = this.actions;
            const compare = this.compare;
            const intro = this.intro;
            const left = this.left;
            const list = this.list;
            const menu = this.menu;
            const navigator = this.navigator;
            const result = this.result;
            const right = this.right;
            const search = this.search;
            const swap = this.swap;
            const widgets = this.widgets;
            init$j({ list });
            init$i({ diff, left, right, search });
            init$h({ leftVM, rightVM });
            init$g({ leftVM, rightVM });
            init$f({ diff, list, search });
            init$e({ menu });
            init$d({ search, searchVM, widgets });
            init$c({ diff });
            init$b({ viewsVM });
            init$a({ diff, actions, list });
            init$9({ diff, compare });
            init$7({ diff, left, menu, right });
            init$6({ diff, actionsVM, intro, list, listVM, navigator, result });
            init$5({ list, navigator });
            init$4({ diff, search, list, navigator });
            init$3({ diff, swap });
            init$2({ diff, list, left, right, search });
            init$8({ diff, leftVM, rightVM });
        }
        enable() {
            panelVM.loading = false;
            if (listVM.items.length) {
                actionsVM.enable();
                if (!this.list.hasSelectedItem())
                    actionsVM.disableCopy();
            }
            compareVM.enable();
            leftVM.enable();
            listVM.enable();
            rightVM.enable();
            swapVM.enable();
            viewsVM.enable();
            this.list.focus();
        }
        disable() {
            panelVM.loading = true;
            actionsVM.disable();
            compareVM.disable();
            leftVM.disable();
            listVM.disable();
            rightVM.disable();
            swapVM.disable();
            viewsVM.disable();
        }
        swapInputs(altKey = false) {
            if (altKey) {
                if (listVM.items.length) {
                    listVM.swapList();
                    leftVM.value = listVM.diffResult.pathA;
                    rightVM.value = listVM.diffResult.pathB;
                }
            }
            else {
                const value = leftVM.value;
                leftVM.value = rightVM.value;
                rightVM.value = value;
            }
        }
        initCompare() {
            this.disable();
            listVM.items = [];
            listVM.requestUpdate();
            msg.send('create:diffs', {
                pathA: leftVM.value,
                pathB: rightVM.value,
            });
        }
        initPanelStates(panel) {
            if (panel === null || panel === void 0 ? void 0 : panel.views)
                viewsVM.setState(panel.views);
            if (panel === null || panel === void 0 ? void 0 : panel.search)
                searchVM.setState(panel.search);
            viewsVM.on('update', () => savePanelState());
            searchVM.on('update', () => savePanelState());
        }
        updateScrollbarPosition() {
            const list = this.list;
            this.navigator.setScrollbarPosition(list.scrollTop / list.scrollHeight);
        }
        updateNavigator(updateMap = true, updateSelection = true) {
            const rowHeight = this.list.rowHeight;
            const values = this.list.filteredListItemViews.map((element) => {
                return {
                    selected: this.list.isSelectedItem(element),
                    status: element.getAttribute('data-status'),
                    offsetHeight: rowHeight,
                };
            });
            const listHeight = this.list.offsetHeight;
            if (updateMap) {
                this.navigator.build(values, listHeight);
                this.navigator.style.top = `${this.panel.offsetHeight}px`;
                this.updateScrollbarPosition();
            }
            if (updateSelection) {
                this.navigator.buildSelection(values, listHeight);
            }
        }
    };
    __decorate([
        L13Query('l13-diff-panel'),
        __metadata("design:type", Function)
    ], L13DiffComponent.prototype, "panel", void 0);
    __decorate([
        L13Query('#left'),
        __metadata("design:type", Function)
    ], L13DiffComponent.prototype, "left", void 0);
    __decorate([
        L13Query('l13-diff-swap'),
        __metadata("design:type", Function)
    ], L13DiffComponent.prototype, "swap", void 0);
    __decorate([
        L13Query('#right'),
        __metadata("design:type", Function)
    ], L13DiffComponent.prototype, "right", void 0);
    __decorate([
        L13Query('l13-diff-actions'),
        __metadata("design:type", Function)
    ], L13DiffComponent.prototype, "actions", void 0);
    __decorate([
        L13Query('l13-diff-compare'),
        __metadata("design:type", Function)
    ], L13DiffComponent.prototype, "compare", void 0);
    __decorate([
        L13Query('l13-diff-navigator'),
        __metadata("design:type", Function)
    ], L13DiffComponent.prototype, "navigator", void 0);
    __decorate([
        L13Query('l13-diff-list'),
        __metadata("design:type", Function)
    ], L13DiffComponent.prototype, "list", void 0);
    __decorate([
        L13Query('l13-diff-intro'),
        __metadata("design:type", Function)
    ], L13DiffComponent.prototype, "intro", void 0);
    __decorate([
        L13Query('l13-diff-no-result'),
        __metadata("design:type", Function)
    ], L13DiffComponent.prototype, "result", void 0);
    __decorate([
        L13Query('l13-diff-widgets'),
        __metadata("design:type", HTMLElement)
    ], L13DiffComponent.prototype, "widgets", void 0);
    L13DiffComponent = __decorate([
        L13Component({
            name: 'l13-diff',
            service: L13DiffViewModelService,
            styles: [styles['l13-diff/l13-diff.css']],
            template: templates['l13-diff/l13-diff.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffComponent);
    function savePanelState() {
        msg.send('save:panelstate', {
            views: viewsVM.getState(),
            search: searchVM.getState(),
        });
    }

    let L13DiffActionsComponent = class L13DiffActionsComponent extends L13Element {
        constructor() {
            super();
            setLabel(this.copyRight, 'Copy Selection to the Left Folder');
            setLabel(this.selectDeleted, 'Select All Deleted Files');
            setLabel(this.selectModified, 'Select All Modfied Files');
            setLabel(this.selectUntracked, 'Select All Created Files');
            setLabel(this.selectAll, 'Select All Files');
            setLabel(this.copyLeft, 'Copy Selection to the Right Folder');
            addButtonActiveStyleEvents(this.copyRight);
            addButtonActiveStyleEvents(this.selectDeleted);
            addButtonActiveStyleEvents(this.selectModified);
            addButtonActiveStyleEvents(this.selectUntracked);
            addButtonActiveStyleEvents(this.selectAll);
            addButtonActiveStyleEvents(this.copyLeft);
            disableContextMenu(this);
            this.copyRight.addEventListener('click', ({ altKey }) => {
                this.dispatchCustomEvent('copy', { from: 'right', altKey });
            });
            this.selectDeleted.addEventListener('click', ({ metaKey, ctrlKey }) => {
                this.dispatchCustomEvent('select', { status: 'deleted', metaKey, ctrlKey });
            });
            this.selectModified.addEventListener('click', ({ metaKey, ctrlKey }) => {
                this.dispatchCustomEvent('select', { status: 'modified', metaKey, ctrlKey });
            });
            this.selectUntracked.addEventListener('click', ({ metaKey, ctrlKey }) => {
                this.dispatchCustomEvent('select', { status: 'untracked', metaKey, ctrlKey });
            });
            this.selectAll.addEventListener('click', ({ metaKey, ctrlKey }) => {
                this.dispatchCustomEvent('select', { metaKey, ctrlKey });
            });
            this.copyLeft.addEventListener('click', ({ altKey }) => {
                this.dispatchCustomEvent('copy', { from: 'left', altKey });
            });
        }
    };
    __decorate([
        L13Query('#l13_copy_right'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffActionsComponent.prototype, "copyRight", void 0);
    __decorate([
        L13Query('#l13_select_deleted'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffActionsComponent.prototype, "selectDeleted", void 0);
    __decorate([
        L13Query('#l13_select_modified'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffActionsComponent.prototype, "selectModified", void 0);
    __decorate([
        L13Query('#l13_select_untracked'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffActionsComponent.prototype, "selectUntracked", void 0);
    __decorate([
        L13Query('#l13_select_all'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffActionsComponent.prototype, "selectAll", void 0);
    __decorate([
        L13Query('#l13_copy_left'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffActionsComponent.prototype, "copyLeft", void 0);
    L13DiffActionsComponent = __decorate([
        L13Component({
            name: 'l13-diff-actions',
            service: L13DiffActionsViewModelService,
            styles: [parseIcons(styles['l13-diff-actions/l13-diff-actions.css'])],
            template: templates['l13-diff-actions/l13-diff-actions.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffActionsComponent);

    let L13DiffCompareComponent = class L13DiffCompareComponent extends L13Element {
        constructor() {
            super();
            setLabel(this.button, 'Compare');
            this.button.addEventListener('click', ({ altKey }) => this.dispatchCustomEvent('compare', { altKey }));
            disableContextMenu(this);
        }
    };
    __decorate([
        L13Query('button'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffCompareComponent.prototype, "button", void 0);
    L13DiffCompareComponent = __decorate([
        L13Component({
            name: 'l13-diff-compare',
            service: L13DiffCompareViewModelService,
            styles: [styles['l13-diff-compare/l13-diff-compare.css']],
            template: templates['l13-diff-compare/l13-diff-compare.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffCompareComponent);

    var _a, _b, _c, _d;
    const COPY_DISABLED = Symbol.for('copyDisabled');
    const GOTO_DISABLED = Symbol.for('gotoDisabled');
    const REVEAL_DISABLED = Symbol.for('revealDisabled');
    const DELETE_DISABLED = Symbol.for('deleteDisabled');
    class L13DiffContextViewModel extends ViewModel {
        constructor() {
            super(...arguments);
            this[_a] = false;
            this[_b] = false;
            this[_c] = false;
            this[_d] = false;
        }
        get copyDisabled() {
            return this[COPY_DISABLED];
        }
        set copyDisabled(value) {
            this[COPY_DISABLED] = value;
            this.requestUpdate();
        }
        get gotoDisabled() {
            return this[GOTO_DISABLED];
        }
        set gotoDisabled(value) {
            this[GOTO_DISABLED] = value;
            this.requestUpdate();
        }
        get revealDisabled() {
            return this[REVEAL_DISABLED];
        }
        set revealDisabled(value) {
            this[REVEAL_DISABLED] = value;
            this.requestUpdate();
        }
        get deleteDisabled() {
            return this[DELETE_DISABLED];
        }
        set deleteDisabled(value) {
            this[DELETE_DISABLED] = value;
            this.requestUpdate();
        }
        enableAll() {
            this[COPY_DISABLED] = false;
            this[GOTO_DISABLED] = false;
            this[REVEAL_DISABLED] = false;
            this[DELETE_DISABLED] = false;
            this.requestUpdate();
        }
        disableAll() {
            this[COPY_DISABLED] = true;
            this[GOTO_DISABLED] = true;
            this[REVEAL_DISABLED] = true;
            this[DELETE_DISABLED] = true;
            this.requestUpdate();
        }
    }
    _a = COPY_DISABLED, _b = GOTO_DISABLED, _c = REVEAL_DISABLED, _d = DELETE_DISABLED;

    class L13DiffContextViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-context';
            this.vmc = L13DiffContextViewModel;
        }
    }

    let L13DiffContextComponent = class L13DiffContextComponent extends L13Element {
        constructor() {
            super();
            setLabel(this.buttonCopy, 'Copy');
            setLabel(this.buttonGoto, 'Go to File');
            setLabel(this.buttonReveal, isMacOs ? 'Reveal in Finder' : isWindows ? 'Reveal in File Explorer' : 'Open Containing Folder');
            setLabel(this.buttonDelete, 'Delete');
            addButtonActiveStyleEvents(this.buttonCopy);
            addButtonActiveStyleEvents(this.buttonGoto);
            addButtonActiveStyleEvents(this.buttonReveal);
            addButtonActiveStyleEvents(this.buttonDelete);
            this.buttonCopy.addEventListener('click', ({ altKey }) => this.dispatchCustomEvent('copy', { altKey }));
            this.buttonGoto.addEventListener('click', ({ altKey }) => this.dispatchCustomEvent('goto', { altKey }));
            this.buttonReveal.addEventListener('click', () => this.dispatchCustomEvent('reveal'));
            this.buttonDelete.addEventListener('click', () => this.dispatchCustomEvent('delete'));
            disableContextMenu(this);
        }
    };
    __decorate([
        L13Query('#copy'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffContextComponent.prototype, "buttonCopy", void 0);
    __decorate([
        L13Query('#goto'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffContextComponent.prototype, "buttonGoto", void 0);
    __decorate([
        L13Query('#reveal'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffContextComponent.prototype, "buttonReveal", void 0);
    __decorate([
        L13Query('#delete'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffContextComponent.prototype, "buttonDelete", void 0);
    L13DiffContextComponent = __decorate([
        L13Component({
            name: 'l13-diff-context',
            service: L13DiffContextViewModelService,
            styles: [parseIcons(styles['l13-diff-context/l13-diff-context.css'])],
            template: templates['l13-diff-context/l13-diff-context.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffContextComponent);

    let L13DiffInputComponent = class L13DiffInputComponent extends L13Element {
        constructor() {
            super();
            this.focused = false;
            setLabel(this.button, 'Pick Folder (Click) or File (Alt + Click)');
            disableContextMenu(this.button);
            this.input.addEventListener('focus', () => __awaiter(this, void 0, void 0, function* () {
                const menu = this.menu;
                this.focused = true;
                msg.send('context', { name: 'l13DiffInputFocus', value: true });
                this.appendChild(menu);
                yield menu.viewmodel.update();
            }));
            this.input.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                if (this.menu.parentNode === this)
                    return;
                const menu = this.menu;
                this.focused = true;
                this.appendChild(menu);
                yield menu.viewmodel.update();
            }));
            this.input.addEventListener('blur', () => {
                const menu = this.menu;
                this.focused = false;
                msg.send('context', { name: 'l13DiffInputFocus', value: false });
                if (!menu.isCursorInMenu && menu.parentNode === this)
                    menu.remove();
            });
            this.input.addEventListener('keydown', ({ key, metaKey, ctrlKey, altKey, shiftKey }) => {
                const menu = this.menu;
                switch (key) {
                    case 'F12':
                        if (metaKey && ctrlKey && altKey && shiftKey)
                            changePlatform();
                        break;
                    case 'Enter':
                        if (menu) {
                            if (menu.parentNode) {
                                const value = menu.getSelection();
                                if (value)
                                    this.viewmodel.value = value;
                                menu.remove();
                            }
                            else
                                this.dispatchCustomEvent('compare');
                        }
                        break;
                    case 'Tab':
                        if (menu && menu.parentNode)
                            menu.remove();
                        break;
                    case 'ArrowUp':
                        if (menu && !menu.parentNode)
                            this.appendChild(menu);
                        menu.selectPrevious();
                        break;
                    case 'ArrowDown':
                        if (menu && !menu.parentNode)
                            this.appendChild(menu);
                        menu.selectNext();
                        break;
                }
            });
            this.input.addEventListener('dragenter', () => {
                this.input.setAttribute('data-value', this.input.value);
                this.viewmodel.value = '';
            });
            this.input.addEventListener('dragleave', () => {
                this.viewmodel.value = this.input.getAttribute('data-value') || '';
                this.input.removeAttribute('data-value');
            });
            this.input.addEventListener('dragover', (event) => event.preventDefault());
            this.input.addEventListener('drop', ({ dataTransfer }) => {
                this.input.removeAttribute('data-value');
                if (dataTransfer) {
                    if (dataTransfer.files[0]) {
                        this.viewmodel.value = dataTransfer.files[0].path;
                    }
                    else {
                        const file = dataTransfer.getData('data-diff-file');
                        if (file)
                            this.viewmodel.value = JSON.parse(file).fsPath;
                    }
                }
            });
            addButtonActiveStyleEvents(this.button);
            this.button.addEventListener('click', (event) => {
                this.viewmodel.pick(event.altKey);
            });
        }
        focus() {
            this.input.focus();
        }
        connectedCallback() {
            super.connectedCallback();
            if (!this.input.placeholder)
                this.input.placeholder = this.getAttribute('placeholder');
        }
    };
    __decorate([
        L13Query('input'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffInputComponent.prototype, "input", void 0);
    __decorate([
        L13Query('button'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffInputComponent.prototype, "button", void 0);
    L13DiffInputComponent = __decorate([
        L13Component({
            name: 'l13-diff-input',
            service: L13DiffInputViewModelService,
            styles: [parseIcons(styles['l13-diff-input/l13-diff-input.css'])],
            template: templates['l13-diff-input/l13-diff-input.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffInputComponent);

    class L13DiffIntroViewModel extends ViewModel {
        constructor() {
            super(...arguments);
            this.disabled = false;
        }
        disable() {
            this.disabled = true;
            this.requestUpdate();
        }
        enable() {
            this.disabled = false;
            this.requestUpdate();
        }
    }

    class L13DiffIntroViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-intro';
            this.vmc = L13DiffIntroViewModel;
        }
    }

    const ALT = '⌥';
    const CMD = '⌘';
    const CTRL = '⌃';
    const SHIFT = '⇧';
    const macOSSymbols = {
        Alt: ALT,
        Cmd: CMD,
        Command: CMD,
        Control: CTRL,
        Ctrl: CTRL,
        Meta: CMD,
        Option: ALT,
        Shift: SHIFT,
    };
    const keyboardShortcuts = [
        {
            description: 'Filter Diff Result',
            key: 'Ctrl+F',
            mac: 'Cmd+F',
        },
        {
            description: 'Delete Selected Files',
            key: 'Delete',
            mac: 'Cmd+Backspace',
        },
    ];
    let L13DiffIntroComponent = class L13DiffIntroComponent extends L13Element {
        constructor() {
            super();
            this.shortcuts.appendChild(createShortcutViews(keyboardShortcuts));
            disableContextMenu(this);
        }
    };
    __decorate([
        L13Query('l13-diff-shortcuts'),
        __metadata("design:type", HTMLElement)
    ], L13DiffIntroComponent.prototype, "shortcuts", void 0);
    L13DiffIntroComponent = __decorate([
        L13Component({
            name: 'l13-diff-intro',
            service: L13DiffIntroViewModelService,
            styles: [parseIcons(styles['l13-diff-intro/l13-diff-intro.css'])],
            template: templates['l13-diff-intro/l13-diff-intro.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffIntroComponent);
    function detectKeybinding({ key, mac, win }) {
        return isMacOs && mac ? mac : isWindows && win ? win : key;
    }
    function getKeyLabel(key) {
        return isMacOs ? macOSSymbols[key] || key : key;
    }
    function createShortcutViews(shortcuts) {
        const fragment = document.createDocumentFragment();
        shortcuts.forEach((shortcut) => fragment.appendChild(createShortcutView(shortcut)));
        return fragment;
    }
    function createShortcutView({ description, key, mac, win }) {
        key = detectKeybinding({ key, mac, win });
        const dl = document.createElement('DL');
        const dt = document.createElement('DT');
        const dd = document.createElement('DD');
        const div = document.createElement('DIV');
        dt.textContent = description;
        div.title = key;
        div.appendChild(createShortcutKeys(key));
        dd.appendChild(div);
        dl.appendChild(dt);
        dl.appendChild(dd);
        return dl;
    }
    function createShortcutKeys(key) {
        const fragment = document.createDocumentFragment();
        key.split('+').forEach((value) => {
            const span = document.createElement('SPAN');
            span.textContent = getKeyLabel(value);
            span.className = '-key';
            fragment.appendChild(span);
        });
        return fragment;
    }

    const pluralBytes = { size: 'Bytes', 1: 'Byte' };

    const { floor, log, pow } = Math;
    const byteUnits = [pluralBytes.size, 'KB', 'MB', 'GB', 'TB', 'PB'];
    const KB = 1024;
    const logKB = log(KB);
    function formatAmount(value, units) {
        return `${value} ${units[value] || units.size}`;
    }
    function formatFileSize(size) {
        const bytes = formatAmount(size, pluralBytes);
        if (size < KB)
            return bytes;
        let i = floor(log(size) / logKB);
        if (!byteUnits[i])
            i = byteUnits.length - 1;
        return `${parseFloat((size / pow(KB, i)).toFixed(2))} ${byteUnits[i]} (${bytes})`;
    }
    function formatDate(date) {
        return `${date.getFullYear()}-${formatDigit(date.getMonth() + 1)}-${formatDigit(date.getDate())} ${date.getHours()}:${formatDigit(date.getMinutes())}:${formatDigit(date.getSeconds())}`;
    }
    function formatList(values) {
        const length = values.length;
        return length > 2 ? `${values.slice(0, -1).join(', ')} and ${values[length - 1]}` : values.join(' and ');
    }
    function formatDigit(digit) {
        return `${digit}`.padStart(2, '0');
    }

    const l13Settings = window.l13Settings;
    msg.on('change:settings', (settings) => {
        if (typeof settings.enablePreview === 'boolean')
            enablePreview = settings.enablePreview;
    });
    let enablePreview = l13Settings.enablePreview;

    function init$1({ context, list }) {
        context.addEventListener('click', (event) => event.stopImmediatePropagation());
        context.addEventListener('dblclick', (event) => event.stopImmediatePropagation());
        context.addEventListener('copy', ({ target, detail }) => {
            if (list.disabled)
                return;
            const fileNode = target.closest('l13-diff-list-file');
            const rowNode = target.closest('l13-diff-list-row');
            const isSelected = rowNode.classList.contains('-selected');
            const selections = list.getIdsBySelection();
            const ids = isSelected ? selections : [rowNode.getAttribute('data-id')];
            if (!isSelected)
                list.currentSelections = selections;
            list.dispatchCustomEvent('copy');
            if (detail.altKey)
                list.viewmodel.multiCopy(ids, fileNode.nextElementSibling ? 'left' : 'right');
            else
                list.viewmodel.copy(ids, fileNode.nextElementSibling ? 'left' : 'right');
        });
        context.addEventListener('goto', ({ target, detail }) => {
            if (list.disabled)
                return;
            const fileNode = target.closest('l13-diff-list-file');
            const rowNode = target.closest('l13-diff-list-row');
            const isSelected = rowNode.classList.contains('-selected');
            const selections = list.getIdsBySelection();
            const ids = isSelected ? selections : [rowNode.getAttribute('data-id')];
            if (!isSelected)
                list.currentSelections = selections;
            list.viewmodel.goto(ids, fileNode.nextElementSibling ? 'left' : 'right', detail.altKey);
        });
        context.addEventListener('reveal', ({ target }) => {
            if (list.disabled)
                return;
            const pathname = target.closest('l13-diff-list-file').getAttribute('data-fs-path');
            msg.send('reveal:file', pathname);
        });
        context.addEventListener('delete', ({ target }) => {
            if (list.disabled)
                return;
            const fileNode = target.closest('l13-diff-list-file');
            const rowNode = target.closest('l13-diff-list-row');
            const isSelected = rowNode.classList.contains('-selected');
            const selections = list.getIdsBySelection();
            const ids = isSelected ? selections : [rowNode.getAttribute('data-id')];
            if (!isSelected)
                list.currentSelections = selections;
            list.dispatchCustomEvent('delete');
            list.viewmodel.delete(ids, isSelected ? 'both' : fileNode.nextElementSibling ? 'left' : 'right');
        });
        list.content.addEventListener('mouseover', (event) => {
            event.stopPropagation();
            event.preventDefault();
            const target = event.target;
            if (target === context)
                return;
            const element = target.closest('l13-diff-list-file');
            if (element) {
                const contextParentNode = context.parentNode;
                if (element.childNodes.length) {
                    if (contextParentNode !== element) {
                        if (contextParentNode)
                            context.remove();
                        const viewmodel = context.viewmodel;
                        switch (element.getAttribute('data-type')) {
                            case 'file':
                            case 'symlink':
                                viewmodel.enableAll();
                                break;
                            case 'folder':
                                viewmodel.enableAll();
                                viewmodel.gotoDisabled = true;
                                break;
                            default:
                                viewmodel.disableAll();
                        }
                        element.appendChild(context);
                    }
                }
                else if (contextParentNode)
                    context.remove();
            }
        }, { capture: true });
        list.content.addEventListener('mouseleave', (event) => {
            event.stopPropagation();
            event.preventDefault();
            const contextParentNode = context.parentNode;
            if (!contextParentNode)
                return;
            const target = event.target;
            const nodeName = target.nodeName;
            if (nodeName === 'L13-DIFF-LIST-FILE' && contextParentNode === target)
                context.remove();
        }, { capture: true });
    }

    function init({ list }) {
        let dragSrcElement = null;
        let dropHoverElement = null;
        list.content.addEventListener('dragstart', (event) => {
            if (list.disabled)
                return;
            dragSrcElement = event.target;
            list.dragSrcRowElement = dragSrcElement.closest('l13-diff-list-row');
            const columnNode = dragSrcElement.closest('l13-diff-list-file');
            const rowNode = columnNode.closest('l13-diff-list-row');
            const diff = list.viewmodel.getDiffById(rowNode.getAttribute('data-id'));
            const file = columnNode.nextElementSibling ? diff.fileA : diff.fileB;
            list.content.classList.add(`-drag-n-drop-${file.type}`);
            dragSrcElement.style.opacity = '0.4';
            event.dataTransfer.setData('data-diff-file', JSON.stringify(file));
        });
        list.content.addEventListener('dragover', (event) => {
            var _a;
            if (list.disabled)
                return;
            event.preventDefault();
            const element = event.target;
            if (element) {
                const dropable = element.closest('l13-diff-list-file');
                if (dropable
                    && !dropable.classList.contains('-error')
                    && !dropable.classList.contains('-unknown')
                    && dropable.getAttribute('data-type') === ((_a = dragSrcElement.parentElement) === null || _a === void 0 ? void 0 : _a.getAttribute('data-type'))) {
                    if (dropHoverElement && dropHoverElement !== dropable) {
                        dropHoverElement.classList.remove('-draghover');
                    }
                    if (dropable !== dropHoverElement && dropable !== (dragSrcElement === null || dragSrcElement === void 0 ? void 0 : dragSrcElement.parentElement) && dropable.firstElementChild) {
                        dropHoverElement = dropable;
                        dropHoverElement.classList.add('-draghover');
                    }
                }
            }
        });
        list.content.addEventListener('dragexit', (event) => {
            event.preventDefault();
            dragSrcElement.style.opacity = '1';
            removeClassesByPrefix(list.content, '-drag-n-drop');
            list.dragSrcRowElement = null;
            dragSrcElement = null;
            if (dropHoverElement) {
                dropHoverElement.classList.remove('-draghover');
                dropHoverElement = null;
            }
        });
        list.content.addEventListener('dragend', (event) => {
            event.preventDefault();
            dragSrcElement.style.opacity = '1';
            removeClassesByPrefix(list.content, '-drag-n-drop');
            list.dragSrcRowElement = null;
            dragSrcElement = null;
            if (dropHoverElement) {
                dropHoverElement.classList.remove('-draghover');
                dropHoverElement = null;
            }
        });
        list.content.addEventListener('dragleave', (event) => {
            event.preventDefault();
            if (dropHoverElement) {
                dropHoverElement.classList.remove('-draghover');
                dropHoverElement = null;
            }
        });
        list.content.addEventListener('drop', (event) => {
            if (list.disabled)
                return;
            event.preventDefault();
            const target = event.target.closest('l13-diff-list-file');
            const rowNode = target.closest('l13-diff-list-row');
            const diff = list.viewmodel.getDiffById(rowNode.getAttribute('data-id'));
            const fileA = JSON.parse(event.dataTransfer.getData('data-diff-file'));
            const fileB = target.nextElementSibling ? diff.fileA : diff.fileB;
            const typeA = fileA.type;
            if (fileA.fsPath === fileB.fsPath || typeA !== fileB.type)
                return;
            msg.send('open:diff', {
                pathA: fileA.root,
                pathB: fileB.root,
                diffs: [
                    {
                        id: null,
                        status: 'modified',
                        type: typeA,
                        ignoredEOL: 0,
                        ignoredBOM: 0,
                        ignoredWhitespace: 0,
                        fileA,
                        fileB,
                    },
                ],
                openToSide: event.altKey,
            });
        });
    }
    function removeClassesByPrefix(element, prefix) {
        const classList = element.classList;
        let i = 0;
        while (i < classList.length) {
            if (classList[i].startsWith(prefix))
                classList.remove(classList[i]);
            else
                i++;
        }
    }

    let L13DiffListComponent = class L13DiffListComponent extends L13Element {
        constructor() {
            super();
            this.disabled = false;
            this.tabIndex = 0;
            this.rowHeight = 22;
            this.previousScrollTop = 0;
            this.currentSelections = [];
            this.cacheSelectionHistory = [];
            this.cacheSelectedListItems = [];
            this.cacheListItems = [];
            this.cacheListItemViews = {};
            this.cacheFilteredListItems = [];
            this.filteredListItemViews = [];
            this.dragSrcRowElement = null;
            this.hasPanelFocus = true;
            this.context = document.createElement('l13-diff-context');
            this.context.vmId = 'context';
            init$1({ context: this.context, list: this });
            init({ list: this });
            disableContextMenu(this);
            this.addEventListener('focus', () => {
                this.content.classList.add('-focus');
                msg.send('context', { name: 'l13DiffListFocus', value: true });
            });
            this.addEventListener('blur', () => {
                this.content.classList.remove('-focus');
                msg.send('context', { name: 'l13DiffListFocus', value: false });
            });
            this.addEventListener('keydown', (event) => {
                if (this.disabled)
                    return;
                const { key, metaKey, ctrlKey, altKey, shiftKey } = event;
                switch (key) {
                    case 'F12':
                        if (metaKey && ctrlKey && altKey && shiftKey)
                            changePlatform();
                        break;
                    case ' ':
                        if (enablePreview) {
                            const lastSelection = this.cacheSelectionHistory[this.cacheSelectionHistory.length - 1];
                            if (lastSelection) {
                                const id = lastSelection.getAttribute('data-id');
                                const type = this.viewmodel.getDiffById(id).type;
                                if (type === 'file' || type === 'symlink') {
                                    this.viewmodel.openPreview(id);
                                }
                                if (this.cacheSelectionHistory.length > 1) {
                                    const ids = this.getIdsBySelection().filter((value) => value !== id);
                                    if (ids.length)
                                        this.viewmodel.open(ids, true);
                                }
                            }
                        }
                        event.preventDefault();
                        break;
                    case 'Enter':
                        this.viewmodel.open(this.getIdsBySelection(), ctrlKey);
                        event.preventDefault();
                        break;
                    case 'ArrowUp':
                        this.selectPreviousOrNext(0, event);
                        break;
                    case 'ArrowDown':
                        this.selectPreviousOrNext(1, event);
                        break;
                    case 'Home':
                    case 'PageUp':
                        if (!isMacOs)
                            this.selectPreviousOrNext(0, event);
                        break;
                    case 'End':
                    case 'PageDown':
                        if (!isMacOs)
                            this.selectPreviousOrNext(1, event);
                        break;
                }
            });
            this.addEventListener('wheel', (event) => {
                event.stopImmediatePropagation();
                event.preventDefault();
                this.scrollTop += event.deltaY;
            });
            this.content.addEventListener('click', ({ detail, target, metaKey, ctrlKey, shiftKey, offsetX }) => __awaiter(this, void 0, void 0, function* () {
                if (this.disabled || detail !== 1)
                    return;
                if (this.content.firstChild && offsetX > this.content.firstChild.offsetWidth)
                    return;
                if (target === this.content) {
                    this.unselect();
                    return;
                }
                const listRow = target.closest('l13-diff-list-row');
                if (enablePreview) {
                    const id = listRow.getAttribute('data-id');
                    const type = this.viewmodel.getDiffById(id).type;
                    if (type === 'file' || type === 'symlink') {
                        yield this.waitForPanelFocus();
                        this.viewmodel.openPreview(id);
                    }
                }
                if (this.cacheSelectionHistory.length) {
                    if (isMacOs && shiftKey && !metaKey || !isMacOs && shiftKey) {
                        const lastSelection = this.cacheSelectionHistory[this.cacheSelectionHistory.length - 1];
                        if (lastSelection) {
                            if (isWindows && !ctrlKey || isLinux) {
                                this.unselect();
                                this.cacheSelectionHistory = [isWindows ? lastSelection : listRow];
                            }
                            if (this.cacheSelectedListItems.length)
                                this.unselectItems(this.cacheSelectedListItems);
                            this.cacheSelectedListItems = this.selectRange(listRow, lastSelection);
                        }
                        else
                            this.selectListItem(listRow);
                    }
                    else if (isMetaKey(ctrlKey, metaKey)) {
                        this.toggleItemSelection(listRow);
                        this.cacheSelectedListItems = [];
                        if (!this.isSelectedItem(listRow))
                            remove(this.cacheSelectionHistory, listRow);
                        else
                            this.cacheSelectionHistory.push(listRow);
                        if (this.hasSelectedItem())
                            this.dispatchEventSelected();
                        else
                            this.dispatchEventUnselected();
                    }
                    else {
                        this.unselect();
                        this.selectListItem(listRow);
                    }
                }
                else
                    this.selectListItem(listRow);
            }));
            this.content.addEventListener('dblclick', ({ target, altKey }) => __awaiter(this, void 0, void 0, function* () {
                if (this.disabled)
                    return;
                const id = target.closest('l13-diff-list-row').getAttribute('data-id');
                const type = this.viewmodel.getDiffById(id).type;
                yield this.waitForPanelFocus();
                this.viewmodel.open([id], type === 'folder' ? altKey : altKey || enablePreview);
            }));
            msg.on('focus', (value) => {
                this.hasPanelFocus = value;
            });
            msg.on('cancel', () => {
                if (this.currentSelections.length)
                    this.currentSelections = [];
            });
        }
        waitForPanelFocus() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.hasPanelFocus)
                    return Promise.resolve(true);
                return new Promise((resolve) => {
                    function focus(value) {
                        if (value) {
                            clearTimeout(timeoutId);
                            msg.removeMessageListener('focus', focus);
                            resolve(true);
                        }
                    }
                    const timeoutId = setTimeout(() => focus(true), 500);
                    msg.on('focus', focus);
                });
            });
        }
        selectListItem(element) {
            this.addItemSelection(element);
            this.cacheSelectionHistory.push(element);
            this.cacheSelectedListItems = [];
            this.dispatchEventSelected();
        }
        selectRange(from, to) {
            const fromIndex = this.getIndex(from);
            const toIndex = this.getIndex(to);
            const [start, end] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
            const elements = this.filteredListItemViews.slice(start, end + 1);
            this.selectItems(elements);
            this.dispatchEventSelected();
            return elements;
        }
        selectItem(element, dispatchEvent = true) {
            this.addItemSelection(element);
            this.cacheSelectionHistory.push(element);
            scrollElementIntoListView(this, element);
            if (dispatchEvent)
                this.dispatchEventSelected();
        }
        selectNoneItem(element, shiftKey) {
            if (!shiftKey && this.cacheSelectionHistory.length > 1) {
                this.unselect();
                this.addItemSelection(element);
                this.cacheSelectionHistory.push(element);
                this.dispatchEventSelected();
            }
            scrollElementIntoListView(this, element);
        }
        addIndex(element, index) {
            element.setAttribute('data-index', `${index}`);
        }
        getIndex(element) {
            return +element.getAttribute('data-index');
        }
        getFirstItem() {
            return this.filteredListItemViews[0];
        }
        getLastItem() {
            return this.filteredListItemViews[this.filteredListItemViews.length - 1];
        }
        getNextItem(element) {
            return this.filteredListItemViews[this.getIndex(element) + 1];
        }
        getPreviousItem(element) {
            return this.filteredListItemViews[this.getIndex(element) - 1];
        }
        isSelectedItem(element) {
            return element.classList.contains('-selected');
        }
        hasSelectedItem() {
            return this.filteredListItemViews.some((element) => element.classList.contains('-selected'));
        }
        getSelectedItems() {
            return this.filteredListItemViews.filter((element) => element.classList.contains('-selected'));
        }
        addItemSelection(element) {
            element.classList.add('-selected');
        }
        removeItemSelection(element) {
            element.classList.remove('-selected');
        }
        toggleItemSelection(element) {
            element.classList.toggle('-selected');
        }
        selectItems(elements) {
            elements.forEach((element) => element.classList.add('-selected'));
        }
        unselectItems(elements) {
            elements.forEach((element) => element.classList.remove('-selected'));
        }
        dispatchEventSelected() {
            this.dispatchCustomEvent('selected');
        }
        dispatchEventUnselected() {
            this.dispatchCustomEvent('unselected');
        }
        getPreviousPageItem(currentElement, viewStart) {
            let previousElementSibling;
            while ((previousElementSibling = this.getPreviousItem(currentElement))) {
                if (parseInt(previousElementSibling.style.top, 10) > viewStart) {
                    currentElement = previousElementSibling;
                    continue;
                }
                break;
            }
            return currentElement;
        }
        getNextPageItem(currentElement, viewEnd) {
            let nextElementSibling;
            while ((nextElementSibling = this.getNextItem(currentElement))) {
                if (parseInt(nextElementSibling.style.top, 10) + this.rowHeight < viewEnd) {
                    currentElement = nextElementSibling;
                    continue;
                }
                break;
            }
            return currentElement;
        }
        selectPreviousOrNextItem(element, shiftKey) {
            if (!shiftKey)
                this.unselect();
            this.cacheSelectionHistory.push(element);
            this.addItemSelection(element);
            scrollElementIntoListView(this, element);
            this.dispatchEventSelected();
        }
        selectFirstOrLastItem(from, to, shiftKey) {
            if (!shiftKey) {
                this.unselect();
                this.addItemSelection(to);
                this.dispatchEventSelected();
            }
            else {
                if (isWindows) {
                    if (this.cacheSelectedListItems.length)
                        this.unselectItems(this.cacheSelectedListItems);
                    if (this.cacheSelectionHistory.length > 1) {
                        this.cacheSelectionHistory.pop();
                        from = this.cacheSelectionHistory[this.cacheSelectionHistory.length - 1];
                    }
                }
                this.cacheSelectedListItems = this.selectRange(from, to);
            }
            this.cacheSelectionHistory.push(to);
            scrollElementIntoListView(this, to);
        }
        selectPreviousOrNextPageItem(currentElement, lastSelection, shiftKey) {
            if (!shiftKey) {
                this.unselect();
                this.addItemSelection(currentElement);
                this.dispatchEventSelected();
            }
            else {
                this.cacheSelectedListItems = this.selectRange(lastSelection, currentElement);
            }
            this.cacheSelectionHistory.push(currentElement);
            scrollElementIntoListView(this, currentElement);
        }
        selectPreviousOrNext(direction, event) {
            if (!this.content.firstChild)
                return;
            this.dispatchEventSelected();
            event.preventDefault();
            const lastSelection = this.cacheSelectionHistory[this.cacheSelectionHistory.length - 1];
            if (direction === 1)
                this.selectNext(event, lastSelection);
            else
                this.selectPrevious(event, lastSelection);
        }
        selectPrevious({ altKey, shiftKey, key }, lastSelection) {
            if (isMacOs) {
                if (!lastSelection)
                    this.selectItem(altKey ? this.getFirstItem() : this.getLastItem());
                else if (!this.getPreviousItem(lastSelection))
                    this.selectNoneItem(lastSelection, shiftKey);
                else if (altKey)
                    this.selectFirstOrLastItem(lastSelection, this.getFirstItem(), shiftKey);
                else
                    this.selectPreviousOrNextItem(this.getPreviousItem(lastSelection), shiftKey);
            }
            else if (key === 'ArrowUp') {
                if (!lastSelection)
                    this.selectItem(this.getLastItem());
                else if (!this.getPreviousItem(lastSelection))
                    this.selectNoneItem(lastSelection, shiftKey);
                else
                    this.selectPreviousOrNextItem(this.getPreviousItem(lastSelection), shiftKey);
            }
            else if (key === 'PageUp') {
                const viewStart = this.scrollTop - 1;
                let currentElement = this.getPreviousPageItem(this.getLastItem(), viewStart);
                if (!lastSelection)
                    this.selectItem(currentElement, false);
                else if (currentElement === lastSelection)
                    currentElement = this.getPreviousPageItem(lastSelection, viewStart - this.offsetHeight);
                this.selectPreviousOrNextPageItem(currentElement, lastSelection, shiftKey);
            }
            else if (key === 'Home') {
                if (!lastSelection)
                    this.selectItem(this.getFirstItem());
                else
                    this.selectFirstOrLastItem(lastSelection, this.getFirstItem(), shiftKey);
            }
        }
        selectNext({ altKey, shiftKey, key }, lastSelection) {
            if (isMacOs) {
                if (!lastSelection)
                    this.selectItem(altKey ? this.getLastItem() : this.getFirstItem());
                else if (!this.getNextItem(lastSelection))
                    this.selectNoneItem(lastSelection, shiftKey);
                else if (altKey)
                    this.selectFirstOrLastItem(lastSelection, this.getLastItem(), shiftKey);
                else
                    this.selectPreviousOrNextItem(this.getNextItem(lastSelection), shiftKey);
            }
            else if (key === 'ArrowDown') {
                if (!lastSelection)
                    this.selectItem(this.getFirstItem());
                else if (!this.getNextItem(lastSelection))
                    this.selectNoneItem(lastSelection, shiftKey);
                else
                    this.selectPreviousOrNextItem(this.getNextItem(lastSelection), shiftKey);
            }
            else if (key === 'PageDown') {
                const viewHeight = this.offsetHeight;
                const viewEnd = this.scrollTop + viewHeight + 1;
                let currentElement = this.getNextPageItem(this.getFirstItem(), viewEnd);
                if (!lastSelection)
                    this.selectItem(currentElement, false);
                else if (currentElement === lastSelection)
                    currentElement = this.getNextPageItem(lastSelection, viewEnd + viewHeight);
                this.selectPreviousOrNextPageItem(currentElement, lastSelection, shiftKey);
            }
            else if (key === 'End') {
                if (!lastSelection)
                    this.selectItem(this.getLastItem());
                else
                    this.selectFirstOrLastItem(lastSelection, this.getLastItem(), shiftKey);
            }
        }
        selectByStatus(typeOrTypes, addToSelection = false) {
            if (!addToSelection)
                this.unselect();
            const types = typeof typeOrTypes === 'string' ? [typeOrTypes] : typeOrTypes;
            let dispatchSelectedEvent = false;
            for (const type of Object.values(types)) {
                const elements = this.filteredListItemViews.filter((element) => element.classList.contains(`-${type}`));
                if (elements.length) {
                    this.selectItems(elements);
                    this.cacheSelectionHistory.push(elements[elements.length - 1]);
                    dispatchSelectedEvent = true;
                }
            }
            if (dispatchSelectedEvent)
                this.dispatchEventSelected();
        }
        selectAll() {
            this.selectByStatus(['conflicting', 'deleted', 'modified', 'unchanged', 'untracked']);
        }
        unselect() {
            this.cacheSelectionHistory = [];
            this.unselectItems(this.filteredListItemViews);
            this.dispatchEventUnselected();
        }
        getIdsBySelection() {
            return this.getSelectedItems().map((element) => element.getAttribute('data-id'));
        }
        copy(from) {
            this.viewmodel.copy(this.getIdsBySelection(), from);
        }
        multiCopy(from) {
            this.viewmodel.multiCopy(this.getIdsBySelection(), from);
        }
        delete() {
            this.viewmodel.delete(this.getIdsBySelection());
        }
        update(options) {
            super.update();
            if (this.viewmodel.items !== this.cacheListItems)
                this.createListItemViews();
            if (this.viewmodel.filteredItems !== this.cacheFilteredListItems)
                this.createFilteredListItemViews(options);
        }
        createListItemViews() {
            const items = this.viewmodel.items;
            const cacheListItemViews = {};
            const foldersA = [];
            const foldersB = [];
            items.forEach(({ fileA, fileB }) => {
                if ((fileA === null || fileA === void 0 ? void 0 : fileA.type) === 'folder')
                    foldersA.push(fileA.dirname + fileA.basename);
                if ((fileB === null || fileB === void 0 ? void 0 : fileB.type) === 'folder')
                    foldersB.push(fileB.dirname + fileB.basename);
            });
            foldersA.sort().reverse();
            foldersB.sort().reverse();
            items.forEach((diff) => {
                const row = document.createElement('l13-diff-list-row');
                const fileA = diff.fileA;
                const fileB = diff.fileB;
                row.classList.add(`-${diff.status}`);
                row.setAttribute('data-status', diff.status);
                row.setAttribute('data-id', diff.id);
                appendColumn(row, diff, fileA, detectExistingFolder(fileA, foldersB, foldersA));
                appendColumn(row, diff, fileB, detectExistingFolder(fileB, foldersA, foldersB));
                cacheListItemViews[diff.id] = row;
            });
            this.cacheListItems = items;
            this.cacheListItemViews = cacheListItemViews;
        }
        createFilteredListItemViews(options) {
            this.unselect();
            removeChildren(this.content);
            this.filteredListItemViews = [];
            this.viewmodel.filteredItems.forEach((diff, index) => {
                const element = this.cacheListItemViews[diff.id];
                this.addIndex(element, index);
                element.style.top = `${index * this.rowHeight}px`;
                this.filteredListItemViews.push(element);
            });
            this.content.style.height = `${this.filteredListItemViews.length * this.rowHeight}px`;
            if (!(options === null || options === void 0 ? void 0 : options.keepPosition)) {
                this.scrollTop = 0;
                this.previousScrollTop = 0;
            }
            this.showVisibleListViewItems(true);
            this.restoreSelections();
            this.cacheFilteredListItems = this.viewmodel.filteredItems;
            this.dispatchCustomEvent('filtered');
        }
        showVisibleListViewItems(forceUpdate) {
            const scrollTop = this.scrollTop;
            const delta = scrollTop - this.previousScrollTop;
            const rowHeight = this.rowHeight;
            if (!forceUpdate && delta > -rowHeight && delta < rowHeight)
                return;
            this.previousScrollTop = scrollTop;
            const elements = this.filteredListItemViews;
            const dragSrcRowElement = this.dragSrcRowElement;
            let nextElement = this.content.firstElementChild;
            let start = Math.floor(scrollTop / rowHeight) - 1;
            let end = Math.ceil((scrollTop + this.offsetHeight) / rowHeight) + 1;
            if (start < 0)
                start = 0;
            if (end > elements.length)
                end = elements.length;
            while (nextElement) {
                const element = nextElement;
                const index = this.getIndex(element);
                nextElement = element.nextElementSibling;
                if (element !== dragSrcRowElement && (index < start || index > end))
                    element.remove();
            }
            const fragment = document.createDocumentFragment();
            for (let i = start; i < end; i++) {
                const element = elements[i];
                if (!element.parentNode)
                    fragment.appendChild(element);
            }
            this.content.appendChild(fragment);
        }
        restoreSelections() {
            const cacheCurrentSelections = this.currentSelections;
            if (cacheCurrentSelections.length) {
                cacheCurrentSelections.forEach((id) => {
                    const element = this.cacheListItemViews[id];
                    if (element.parentNode)
                        this.addItemSelection(element);
                });
                this.currentSelections = [];
                this.dispatchEventSelected();
            }
        }
    };
    __decorate([
        L13Query('l13-diff-list-content'),
        __metadata("design:type", HTMLElement)
    ], L13DiffListComponent.prototype, "content", void 0);
    L13DiffListComponent = __decorate([
        L13Component({
            name: 'l13-diff-list',
            service: L13DiffListViewModelService,
            styles: [parseIcons(styles['l13-diff-list/l13-diff-list.css'])],
            template: templates['l13-diff-list/l13-diff-list.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffListComponent);
    function appendColumn(parent, diff, file, exists) {
        const column = document.createElement('l13-diff-list-file');
        if (file) {
            const type = file.type;
            const fsPath = file.fsPath;
            column.classList.add(`-${type}`);
            column.setAttribute('data-type', type);
            column.setAttribute('data-fs-path', fsPath);
            column.title = fsPath;
            if (file.stat) {
                const stat = file.stat;
                column.title += `
Size: ${formatFileSize(stat.size)}
Created: ${formatDate(new Date(stat.birthtime))}
Modified: ${formatDate(new Date(stat.mtime))}`;
            }
            if (file.ignore) {
                if (!diff.fileA)
                    column.classList.add('-untracked');
                if (!diff.fileB)
                    column.classList.add('-deleted');
            }
            const path = document.createElement('DIV');
            path.classList.add('-path');
            path.draggable = type === 'file' || type === 'folder' || type === 'symlink';
            column.appendChild(path);
            if (file.dirname) {
                const dirname = document.createDocumentFragment();
                if (exists[0]) {
                    const dirnameExists = document.createElement('SPAN');
                    dirnameExists.classList.add('-exists');
                    dirnameExists.textContent = exists[0];
                    dirname.appendChild(dirnameExists);
                }
                if (exists[1]) {
                    const dirnameMissing = document.createElement('SPAN');
                    dirnameMissing.classList.add('-missing');
                    dirnameMissing.textContent = exists[1];
                    dirname.appendChild(dirnameMissing);
                }
                path.appendChild(dirname);
            }
            const basename = document.createElement('SPAN');
            basename.textContent = file.basename;
            basename.classList.add('-basename');
            path.appendChild(basename);
            if (diff.status === 'unchanged' && (diff.ignoredBOM || diff.ignoredEOL || diff.ignoredWhitespace)) {
                const ignored = document.createElement('SPAN');
                const modified = diff.fileA === file ? 1 : 2;
                const values = [];
                if (diff.ignoredBOM === 3 || diff.ignoredBOM === modified)
                    values.push('BOM');
                if (diff.ignoredEOL === 3 || diff.ignoredEOL === modified)
                    values.push('EOL');
                if (diff.ignoredWhitespace === 3 || diff.ignoredWhitespace === modified)
                    values.push('Whitespace');
                if (values.length) {
                    ignored.textContent = `(ignored ${formatList(values)})`;
                    ignored.classList.add('-info');
                    path.appendChild(ignored);
                }
            }
        }
        parent.appendChild(column);
    }
    function detectExistingFolder(file, otherFolders, sameFolders) {
        if (!file)
            return null;
        const dirname = file.dirname;
        for (const folder of otherFolders) {
            if (dirname.startsWith(folder) && sameFolders.includes(folder)) {
                return [folder, dirname.replace(folder, '')];
            }
        }
        return [null, file.dirname];
    }
    function scrollElementIntoListView(list, element) {
        if (!element.parentNode)
            list.content.appendChild(element);
        scrollElementIntoView(list, element);
    }

    class L13DiffNavigatorViewModel extends ViewModel {
    }

    class L13DiffNavigatorViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-navigator';
            this.vmc = L13DiffNavigatorViewModel;
        }
    }

    const { round } = Math;
    let L13DiffNavigatorComponent = class L13DiffNavigatorComponent extends L13Element {
        constructor() {
            super();
            this.scrollbarOffsetY = 0;
            this.scrollbarMaxY = 0;
            this.previousScrollbarY = 0;
            this.contextRuler = null;
            this.contextMap = null;
            this.moveScrollbar = (event) => {
                const offsetY = round(this.scrollbar.offsetHeight / 2);
                this.calcScrollbarY(event.offsetY - offsetY);
                this.scrollbarDown(event, offsetY);
            };
            this.scrollbarDown = (event, offsetY) => {
                document.documentElement.classList.add('-unselectable');
                this.scrollbarOffsetY = offsetY || event.offsetY;
                event.preventDefault();
                event.stopPropagation();
                document.addEventListener('mousemove', this.scrollbarMove);
                document.addEventListener('mouseup', this.scrollbarUp);
                this.dispatchCustomEvent('mousedownscroll');
            };
            this.scrollbarMove = (event) => {
                if (!event.which)
                    return this.scrollbarUp();
                this.calcScrollbarY(event.clientY - this.scrollbarOffsetY - this.offsetTop);
            };
            this.scrollbarUp = () => {
                document.removeEventListener('mousemove', this.scrollbarMove);
                document.removeEventListener('mouseup', this.scrollbarUp);
                document.documentElement.classList.remove('-unselectable');
                this.dispatchCustomEvent('mouseupscroll');
            };
            this.contextRuler = this.canvasRuler.getContext('2d');
            this.canvasRuler.width = 14;
            this.contextMap = this.canvasMap.getContext('2d');
            this.canvasMap.width = 30;
            this.scrollbar.addEventListener('mousedown', this.scrollbarDown);
            this.canvasMap.addEventListener('mousedown', this.moveScrollbar);
            disableContextMenu(this);
        }
        calcScrollbarY(y) {
            if (y < 0)
                y = 0;
            else if (y > this.scrollbarMaxY)
                y = this.scrollbarMaxY;
            if (this.previousScrollbarY === y)
                return;
            this.dispatchCustomEvent('mousemovescroll', { y, height: this.scrollbar.offsetHeight });
        }
        setScrollbarPosition(ratio) {
            let y = round(ratio * this.canvasMap.offsetHeight);
            const maxY = this.scrollbarMaxY;
            if (y < 0)
                y = 0;
            else if (y > maxY)
                y = maxY;
            if (this.previousScrollbarY === y)
                return;
            this.previousScrollbarY = y;
            this.scrollbar.style.top = `${y}px`;
        }
        clearSelection() {
            const canvas = this.canvasRuler;
            const context = this.contextRuler;
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
        buildSelection(items, listHeight) {
            const total = items.reduce((value, { offsetHeight }) => value += offsetHeight, 0);
            const canvas = this.canvasRuler;
            const context = this.contextRuler;
            const computedStyle = getComputedStyle(document.documentElement);
            const color = computedStyle.getPropertyValue('--vscode-editorOverviewRuler-selectionHighlightForeground');
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvas.height = listHeight;
            items.reduce((y, { offsetHeight, selected }) => {
                const h = offsetHeight / total * canvas.height;
                if (!selected)
                    return y + h;
                context.fillStyle = color;
                context.fillRect(5, round(y + h / 2) - 2, 4, 5);
                return y + h;
            }, 0);
        }
        build(items, listHeight) {
            const total = items.reduce((value, { offsetHeight }) => value += offsetHeight, 0);
            const canvas = this.canvasMap;
            const context = this.contextMap;
            const computedStyle = getComputedStyle(document.documentElement);
            const colors = {
                conflicting: computedStyle.getPropertyValue('--vscode-gitDecoration-conflictingResourceForeground'),
                deleted: computedStyle.getPropertyValue('--vscode-gitDecoration-deletedResourceForeground'),
                modified: computedStyle.getPropertyValue('--vscode-gitDecoration-modifiedResourceForeground'),
                untracked: computedStyle.getPropertyValue('--vscode-gitDecoration-untrackedResourceForeground'),
            };
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvas.height = listHeight;
            if (total !== listHeight) {
                this.scrollbar.style.display = 'block';
                this.scrollbar.style.height = `${round(listHeight / total * canvas.height)}px`;
                this.scrollbarMaxY = listHeight - this.scrollbar.offsetHeight;
            }
            else
                this.scrollbar.style.display = 'none';
            items.reduce((y, { status, offsetHeight }) => {
                const h = offsetHeight / total * canvas.height;
                const color = colors[status];
                if (!color)
                    return y + h;
                const roundY = round(y);
                let x = 0;
                let width = canvas.width;
                if (status === 'deleted')
                    width /= 2;
                else if (status === 'untracked')
                    x = width /= 2;
                context.fillStyle = color;
                context.fillRect(x, roundY, width, round(y + h) - roundY || 1);
                return y + h;
            }, 0);
        }
    };
    __decorate([
        L13Query('#ruler'),
        __metadata("design:type", HTMLCanvasElement)
    ], L13DiffNavigatorComponent.prototype, "canvasRuler", void 0);
    __decorate([
        L13Query('#map'),
        __metadata("design:type", HTMLCanvasElement)
    ], L13DiffNavigatorComponent.prototype, "canvasMap", void 0);
    __decorate([
        L13Query('div'),
        __metadata("design:type", HTMLDivElement)
    ], L13DiffNavigatorComponent.prototype, "scrollbar", void 0);
    L13DiffNavigatorComponent = __decorate([
        L13Component({
            name: 'l13-diff-navigator',
            service: L13DiffNavigatorViewModelService,
            styles: [styles['l13-diff-navigator/l13-diff-navigator.css']],
            template: templates['l13-diff-navigator/l13-diff-navigator.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffNavigatorComponent);

    class L13DiffMenuViewModel extends ViewModel {
        constructor() {
            super(...arguments);
            this.history = [];
            this.workspaces = [];
        }
        update() {
            return new Promise((resolve) => {
                msg.on('update:menu', (data) => {
                    this.updateHistory(data.history);
                    this.updateWorkspaces(data.workspaces);
                    msg.removeMessageListener('update:menu', this.update);
                    resolve(undefined);
                });
                msg.send('update:menu');
            });
        }
        updateHistory(history) {
            if (history) {
                if (`${history}` !== `${this.history}`) {
                    this.history = history;
                    this.requestUpdate();
                }
            }
            else
                this.history = [];
        }
        updateWorkspaces(workspaces) {
            if (workspaces) {
                if (`${workspaces}` !== `${this.workspaces}`) {
                    this.workspaces = workspaces;
                    this.requestUpdate();
                }
            }
            else
                this.workspaces = [];
        }
    }

    class L13DiffMenuViewModelService extends ViewModelService {
        constructor() {
            super(...arguments);
            this.name = 'l13-diff-menu';
            this.vmc = L13DiffMenuViewModel;
        }
    }

    let L13DiffMenuComponent = class L13DiffMenuComponent extends L13Element {
        constructor() {
            super();
            this.isCursorInMenu = false;
            this.listRecentlyUsed = document.createElement('UL');
            this.listWorkspaces = document.createElement('UL');
            disableContextMenu(this);
            this.addEventListener('mouseenter', () => this.isCursorInMenu = true);
            this.addEventListener('mouseleave', () => this.isCursorInMenu = false);
            this.lists.addEventListener('click', (event) => {
                const item = event.target.closest('li');
                const parentNode = this.parentNode;
                if (parentNode instanceof L13DiffInputComponent) {
                    parentNode.viewmodel.value = item.firstElementChild.textContent;
                    parentNode.focus();
                    this.remove();
                }
            });
        }
        update() {
            super.update();
            removeChildren(this.lists);
            if (this.viewmodel.history.length) {
                this.updateList(this.listRecentlyUsed, this.viewmodel.history, 'recently used');
                this.lists.appendChild(this.listRecentlyUsed);
            }
            if (this.viewmodel.workspaces.length) {
                this.updateList(this.listWorkspaces, this.viewmodel.workspaces, 'workspaces');
                this.lists.appendChild(this.listWorkspaces);
            }
        }
        updateList(list, entries, info) {
            const fragment = document.createDocumentFragment();
            removeChildren(list);
            entries.forEach((entry, index) => {
                const item = document.createElement('LI');
                const path = document.createElement('DIV');
                path.classList.add('-path');
                path.textContent = entry;
                item.appendChild(path);
                setLabel(item, entry);
                if (index === 0) {
                    const description = document.createElement('DIV');
                    description.classList.add('-info');
                    description.textContent = info;
                    item.appendChild(description);
                }
                fragment.appendChild(item);
            });
            list.appendChild(fragment);
        }
        selectPrevious() {
            const listElements = this.lists.querySelectorAll('li');
            if (!listElements.length)
                return;
            const elementActive = this.lists.querySelector('.-active');
            if (elementActive) {
                if (listElements.length === 1)
                    return;
                const index = Array.prototype.indexOf.call(listElements, elementActive);
                const elementPrevious = listElements[index - 1] || listElements[listElements.length - 1];
                scrollElementIntoView(this, elementPrevious);
                elementActive.classList.remove('-active');
                elementPrevious.classList.add('-active');
            }
            else
                listElements[listElements.length - 1].classList.add('-active');
        }
        selectNext() {
            const listElements = this.lists.querySelectorAll('li');
            if (!listElements.length)
                return;
            const elementActive = this.lists.querySelector('.-active');
            if (elementActive) {
                if (listElements.length === 1)
                    return;
                const index = Array.prototype.indexOf.call(listElements, elementActive);
                const elementNext = listElements[index + 1] || listElements[0];
                scrollElementIntoView(this, elementNext);
                elementActive.classList.remove('-active');
                elementNext.classList.add('-active');
            }
            else
                listElements[0].classList.add('-active');
        }
        getSelection() {
            const elementActive = this.lists.querySelector('.-active');
            return elementActive ? elementActive.textContent : '';
        }
        remove() {
            const elementActive = this.lists.querySelector('.-active');
            if (elementActive)
                elementActive.classList.remove('-active');
            super.remove();
            this.isCursorInMenu = false;
        }
    };
    __decorate([
        L13Query('l13-diff-menu-lists'),
        __metadata("design:type", HTMLElement)
    ], L13DiffMenuComponent.prototype, "lists", void 0);
    L13DiffMenuComponent = __decorate([
        L13Component({
            name: 'l13-diff-menu',
            service: L13DiffMenuViewModelService,
            styles: [styles['l13-diff-menu/l13-diff-menu.css']],
            template: templates['l13-diff-menu/l13-diff-menu.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffMenuComponent);

    let L13DiffPanelComponent = class L13DiffPanelComponent extends L13Element {
    };
    L13DiffPanelComponent = __decorate([
        L13Component({
            name: 'l13-diff-panel',
            service: L13DiffPanelViewModelService,
            styles: [styles['l13-diff-panel/l13-diff-panel.css']],
            template: templates['l13-diff-panel/l13-diff-panel.html'],
        })
    ], L13DiffPanelComponent);

    let L13DiffSearchComponent = class L13DiffSearchComponent extends L13Element {
        constructor() {
            super();
            this.right = 0;
            this.resizerOffsetX = 0;
            this.focused = false;
            this.resizeDown = (event) => {
                document.documentElement.classList.add('-unselectable');
                document.body.style.cursor = 'col-resize';
                this.right = this.getBoundingClientRect().right;
                this.resizerOffsetX = event.offsetX;
                event.preventDefault();
                document.addEventListener('mousemove', this.resizeMove);
                document.addEventListener('mouseup', this.resizeUp);
            };
            this.resizeMove = (event) => {
                if (!event.which)
                    return this.resizeUp();
                const width = this.right + this.resizerOffsetX - event.clientX;
                this.style.width = `${width}px`;
            };
            this.resizeUp = () => {
                document.removeEventListener('mousemove', this.resizeMove);
                document.removeEventListener('mouseup', this.resizeUp);
                document.documentElement.classList.remove('-unselectable');
                document.body.style.cursor = '';
            };
            setLabel(this.inputCaseSensitive, 'Match Case');
            setLabel(this.inputRegExp, 'Use Regular Expression');
            setLabel(this.inputFiles, 'Show Files');
            setLabel(this.inputFolders, 'Show Folders');
            setLabel(this.inputSymlinks, 'Show Symbolic Links');
            setLabel(this.inputConflicts, 'Show Conflicts');
            setLabel(this.inputOthers, 'Show Errors and Others');
            setLabel(this.button, 'Close');
            disableContextMenu(this.resizer);
            disableContextMenu(this.inputCaseSensitive);
            disableContextMenu(this.inputCaseSensitive);
            disableContextMenu(this.inputRegExp);
            disableContextMenu(this.inputFiles);
            disableContextMenu(this.inputFolders);
            disableContextMenu(this.inputSymlinks);
            disableContextMenu(this.inputConflicts);
            disableContextMenu(this.inputOthers);
            disableContextMenu(this.button);
            this.inputRegExp.addEventListener('mouseup', () => this.inputSearchterm.focus());
            this.inputCaseSensitive.addEventListener('mouseup', () => this.inputSearchterm.focus());
            this.inputSearchterm.placeholder = 'Find';
            this.inputSearchterm.addEventListener('focus', () => {
                this.focused = true;
                msg.send('context', { name: 'l13DiffSearchFocus', value: true });
            });
            this.inputSearchterm.addEventListener('blur', () => {
                this.focused = false;
                msg.send('context', { name: 'l13DiffSearchFocus', value: false });
            });
            this.inputSearchterm.addEventListener('dragover', (event) => event.preventDefault());
            this.inputSearchterm.addEventListener('drop', ({ dataTransfer }) => {
                if (dataTransfer) {
                    const file = dataTransfer.getData('data-diff-file');
                    if (file)
                        this.viewmodel.searchterm = JSON.parse(file).name;
                }
            });
            this.button.addEventListener('click', () => this.close());
            this.resizer.addEventListener('mousedown', this.resizeDown);
        }
        focus() {
            const input = this.inputSearchterm;
            input.focus();
            if (input.value)
                input.select();
        }
        close() {
            this.dispatchCustomEvent('close');
        }
    };
    __decorate([
        L13Query('#l13_resizer'),
        __metadata("design:type", HTMLElement)
    ], L13DiffSearchComponent.prototype, "resizer", void 0);
    __decorate([
        L13Query('#l13_searchterm'),
        L13Class({ '-error': 'error' }),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffSearchComponent.prototype, "inputSearchterm", void 0);
    __decorate([
        L13Query('#l13_case_sensitive'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffSearchComponent.prototype, "inputCaseSensitive", void 0);
    __decorate([
        L13Query('#l13_use_regexp'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffSearchComponent.prototype, "inputRegExp", void 0);
    __decorate([
        L13Query('#l13_use_files'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffSearchComponent.prototype, "inputFiles", void 0);
    __decorate([
        L13Query('#l13_use_folders'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffSearchComponent.prototype, "inputFolders", void 0);
    __decorate([
        L13Query('#l13_use_symlinks'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffSearchComponent.prototype, "inputSymlinks", void 0);
    __decorate([
        L13Query('#l13_use_conflicts'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffSearchComponent.prototype, "inputConflicts", void 0);
    __decorate([
        L13Query('#l13_use_others'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffSearchComponent.prototype, "inputOthers", void 0);
    __decorate([
        L13Query('button'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffSearchComponent.prototype, "button", void 0);
    L13DiffSearchComponent = __decorate([
        L13Component({
            name: 'l13-diff-search',
            service: L13DiffSearchViewModelService,
            styles: [parseIcons(styles['l13-diff-search/l13-diff-search.css'])],
            template: templates['l13-diff-search/l13-diff-search.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffSearchComponent);

    let L13DiffSwapComponent = class L13DiffSwapComponent extends L13Element {
        constructor() {
            super();
            setLabel(this.button, 'Swap Paths');
            this.button.addEventListener('click', (event) => this.dispatchCustomEvent('swap', event));
            addButtonActiveStyleEvents(this.button);
            disableContextMenu(this);
        }
    };
    __decorate([
        L13Query('button'),
        __metadata("design:type", HTMLButtonElement)
    ], L13DiffSwapComponent.prototype, "button", void 0);
    L13DiffSwapComponent = __decorate([
        L13Component({
            name: 'l13-diff-swap',
            service: L13DiffSwapViewModelService,
            styles: [parseIcons(styles['l13-diff-swap/l13-diff-swap.css'])],
            template: templates['l13-diff-swap/l13-diff-swap.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffSwapComponent);

    let L13DiffViewsComponent = class L13DiffViewsComponent extends L13Element {
        constructor() {
            super();
            setLabel(this.unchanged, 'Show All Unchanged Files');
            setLabel(this.deleted, 'Show All Deleted Files');
            setLabel(this.modified, 'Show All Modified Files');
            setLabel(this.untracked, 'Show All Created Files');
            setLabel(this.ignored, 'Show All Ignored Files');
            addButtonActiveStyleEvents(this.unchanged);
            addButtonActiveStyleEvents(this.deleted);
            addButtonActiveStyleEvents(this.modified);
            addButtonActiveStyleEvents(this.untracked);
            addButtonActiveStyleEvents(this.ignored);
            disableContextMenu(this);
        }
    };
    __decorate([
        L13Query('#l13_show_unchanged'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffViewsComponent.prototype, "unchanged", void 0);
    __decorate([
        L13Query('#l13_show_deleted'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffViewsComponent.prototype, "deleted", void 0);
    __decorate([
        L13Query('#l13_show_modified'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffViewsComponent.prototype, "modified", void 0);
    __decorate([
        L13Query('#l13_show_untracked'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffViewsComponent.prototype, "untracked", void 0);
    __decorate([
        L13Query('#l13_show_ignored'),
        __metadata("design:type", HTMLInputElement)
    ], L13DiffViewsComponent.prototype, "ignored", void 0);
    L13DiffViewsComponent = __decorate([
        L13Component({
            name: 'l13-diff-views',
            service: L13DiffViewsViewModelService,
            styles: [parseIcons(styles['l13-diff-views/l13-diff-views.css'])],
            template: templates['l13-diff-views/l13-diff-views.html'],
        }),
        __metadata("design:paramtypes", [])
    ], L13DiffViewsComponent);

})();
