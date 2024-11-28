/**
 * @file
 * JavaScript behaviors for iCheck integration.
 */

(function ($, Drupal) {

  'use strict';

  // @see http://icheck.fronteed.com/#options
  Drupal.webform = Drupal.webform || {};
  Drupal.webform.iCheck = Drupal.webform.iCheck || {};
  Drupal.webform.iCheck.options = Drupal.webform.iCheck.options || {};

  /**
   * Enhance checkboxes and radios using iCheck.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformICheck = {
    attach: function (context) {
      if (!$.fn.iCheck) {
        return;
      }
      $('input[data-webform-icheck]', context).each(function () {
        var $input = $(this);
        var icheck = $input.attr('data-webform-icheck');

        var options = $.extend({
          checkboxClass: 'icheckbox_' + icheck,
          radioClass: 'iradio_' + icheck
        }, Drupal.webform.iCheck.options);

        // The line skin requires that the label be added to the options.
        // @see http://icheck.fronteed.com/#skin-line
        if (icheck.indexOf('line') === 0) {
          var $label = $input.parent().find('label[for="' + $input.attr('id') + '"]');

          // Set insert with label text.
          options.insert = '<div class="icheck_line-icon"></div>' + $label.text();

          // Make sure checkbox is outside the label and then remove the label.
          $label.insertAfter($input).remove();
        }

        $input.addClass('js-webform-icheck')
          .iCheck(options)
          // @see https://github.com/fronteed/iCheck/issues/244
          .on('ifChecked', function (e) {
            $(e.target).attr('checked', 'checked').trigger('change');
          })
          .on('ifUnchecked', function (e) {
            $(e.target).removeAttr('checked').trigger('change');
          });
      });
    }
  };

  /**
   * Enhance table select checkall.
   *
   * ISSUE: Select all is not sync'd with checkboxes because iCheck overrides all existing event handlers.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformICheckTableSelectAll = {
    attach: function (context) {
      if (!$.fn.iCheck) {
        return;
      }

      $('table[data-webform-icheck] th.select-all').bind('DOMNodeInserted', function () {
        $(this).unbind('DOMNodeInserted');
        $(this).find('input[type="checkbox"]').each(function () {
          var icheck = $(this).closest('table[data-webform-icheck]').attr('data-webform-icheck');

          var options = $.extend({
            checkboxClass: 'icheckbox_' + icheck,
            radioClass: 'iradio_' + icheck
          }, Drupal.webform.iCheck.options);

          $(this).iCheck(options);
        })
          .on('ifChanged', function () {
            var _index = $(this).parents('th').index() + 1;
            $(this).parents('thead').next('tbody').find('tr td:nth-child(' + _index + ') input')
              .iCheck(!$(this).is(':checked') ? 'check' : 'uncheck')
              .iCheck($(this).is(':checked') ? 'check' : 'uncheck');
          });
      });
    }
  };

  /**
   * Sync iCheck element when checkbox/radio is enabled/disabled via the #states.
   *
   * @see core/misc/states.js
   */
  if ($.fn.iCheck) {
    $(document).on('state:disabled', function (e) {
      if ($(e.target).hasClass('.js-webform-icheck')) {
        $(e.target).iCheck(e.value ? 'disable' : 'enable');
      }

      $(e.target).iCheck(e.value ? 'disable' : 'enable');
    });
  }

})(jQuery, Drupal);
;
/**
 * @file
 * Attaches behaviors for the Clientside Validation jQuery module.
 */

(function ($, drupalSettings, once) {

  'use strict';

  // Disable clientside validation for webforms submitted using Ajax.
  // This prevents Computed elements with Ajax from breaking.
  // @see \Drupal\clientside_validation_jquery\Form\ClientsideValidationjQuerySettingsForm
  drupalSettings.clientside_validation_jquery.validate_all_ajax_forms = 0;

  /**
   * Add .cv-validate-before-ajax to all webform submit buttons.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformClientSideValidationAjax = {
    attach: function (context) {
      $(once('webform-clientside-validation-ajax', 'form.webform-submission-form .form-actions input[type="submit"]:not([formnovalidate])'))
        .addClass('cv-validate-before-ajax');
    }
  };

  /**
   * Fix date/time min, max, and step validation issues.
   *
   * @type {Drupal~behavior}
   *
   * @see https://github.com/jquery-validation/jquery-validation/pull/2119/commits
   */
  Drupal.behaviors.webformClientSideValidationDateTimeFix = {
    attach: function (context) {
      $(context).find(':input[type="date"], :input[type="time"], :input[type="datetime"]')
        .removeAttr('step')
        .removeAttr('min')
        .removeAttr('max');
    }
  };

  // Trigger 'cvjquery' once to prevent the cv.jquery.ife.js from initializing.
  // The webform_clientside_validation.module loads before the
  // clientside_validation_jquery.module.
  // @see clientside_validation/clientside_validation_jquery/js/cv.jquery.ife.js
  // @see https://www.drupal.org/project/clientside_validation/issues/3322946
  // @see https://www.drupal.org/node/3158256
  //
  // Drupal 10: Using once can not use `window` or `document` directly.
  once('cvjquery', 'html');
  // Drupal 9: Use jQuery once plugin.
  $(document).once && $(document).once('cvjquery');

  $(document).on('cv-jquery-validate-options-update', function (event, options) {
    options.errorElement = 'strong';
    options.showErrors = function (errorMap, errorList) {
      // Show errors using defaultShowErrors().
      this.defaultShowErrors();

      // Add '.form-item--error-message' class to all errors.
      $(this.currentForm).find('strong.error').addClass('form-item--error-message');

      // Move all radios, checkboxes, and datelist errors to appear after
      // the parent container.
      var selectors = [
        '.form-checkboxes',
        '.form-radios',
        '.form-boolean-group',
        '.form-type-datelist .container-inline',
        '.form-type-tel',
        '.webform-type-webform-height .form--inline',
        '.js-webform-tableselect'
      ];
      $(this.currentForm).find(selectors.join(', ')).each(function () {
        var $container = $(this);
        var $errorMessages = $container.find('strong.error.form-item--error-message');
        $errorMessages.insertAfter($container);
      });

      // Move all select2 and chosen errors to appear after the parent container.
      $(this.currentForm).find('.webform-select2 ~ .select2, .webform-chosen ~ .chosen-container').each(function () {
        var $widget = $(this);
        var $select = $widget.parent().find('select');
        var $errorMessages = $widget.parent().find('strong.error.form-item--error-message');
        if ($select.hasClass('error')) {
          $errorMessages.insertAfter($widget);
          $widget.addClass('error');
        }
        else {
          $errorMessages.hide();
          $widget.removeClass('error');
        }
      });

      // Move checkbox errors to appear as the last item in the
      // parent container.
      $(this.currentForm).find('.js-form-type-checkbox').each(function () {
        var $container = $(this);
        var $errorMessages = $container.find('strong.error.form-item--error-message');
        $container.append($errorMessages);
      });

      // Move all likert errors to question <label>.
      $(this.currentForm).find('.webform-likert-table tbody tr').each(function () {
        var $row = $(this);
        var $errorMessages = $row.find('strong.error.form-item--error-message');
        $errorMessages.appendTo($row.find('td:first-child'));
      });

      // Move error after field suffix.
      $(this.currentForm).find('strong.error.form-item--error-message ~ .field-suffix').each(function () {
        var $fieldSuffix = $(this);
        var $errorMessages = $fieldSuffix.prev('strong.error.form-item--error-message');
        $errorMessages.insertAfter($fieldSuffix);
      });

      // Add custom clear error handling to checkboxes to remove the
      // error message, when any checkbox is checked.
      $(once('webform-clientside-validation-form-checkboxes', '.form-checkboxes', this.currentForm)).each(function () {
        var $container = $(this);
        $container.find('input:checkbox').click( function () {
          var state = $container.find('input:checkbox:checked').length ? 'hide' : 'show';
          var $message = $container.next('strong.error.form-item--error-message');
          $message[state]();

          // Ensure the message is set. This code addresses an expected bug
          // where the error message is emptied when it is toggled.
          var message = $container.find('[data-msg-required]').data('msg-required');
          $message.html(message);
        });
      });
    };
  });

})(jQuery, drupalSettings, once);
;
/**
 * @file
 * Form features.
 */

/**
 * Triggers when a value in the form changed.
 *
 * The event triggers when content is typed or pasted in a text field, before
 * the change event triggers.
 *
 * @event formUpdated
 */

/**
 * Triggers when a click on a page fragment link or hash change is detected.
 *
 * The event triggers when the fragment in the URL changes (a hash change) and
 * when a link containing a fragment identifier is clicked. In case the hash
 * changes due to a click this event will only be triggered once.
 *
 * @event formFragmentLinkClickOrHashChange
 */

(function ($, Drupal, debounce) {
  /**
   * Retrieves the summary for the first element.
   *
   * @return {string}
   *   The text of the summary.
   */
  $.fn.drupalGetSummary = function () {
    const callback = this.data('summaryCallback');
    return this[0] && callback ? callback(this[0]).trim() : '';
  };

  /**
   * Sets the summary for all matched elements.
   *
   * @param {function} callback
   *   Either a function that will be called each time the summary is
   *   retrieved or a string (which is returned each time).
   *
   * @return {jQuery}
   *   jQuery collection of the current element.
   *
   * @fires event:summaryUpdated
   *
   * @listens event:formUpdated
   */
  $.fn.drupalSetSummary = function (callback) {
    const self = this;

    // To facilitate things, the callback should always be a function. If it's
    // not, we wrap it into an anonymous function which just returns the value.
    if (typeof callback !== 'function') {
      const val = callback;
      callback = function () {
        return val;
      };
    }

    return (
      this.data('summaryCallback', callback)
        // To prevent duplicate events, the handlers are first removed and then
        // (re-)added.
        .off('formUpdated.summary')
        .on('formUpdated.summary', () => {
          self.trigger('summaryUpdated');
        })
        // The actual summaryUpdated handler doesn't fire when the callback is
        // changed, so we have to do this manually.
        .trigger('summaryUpdated')
    );
  };

  /**
   * Prevents consecutive form submissions of identical form values.
   *
   * Repetitive form submissions that would submit the identical form values
   * are prevented, unless the form values are different to the previously
   * submitted values.
   *
   * This is a simplified re-implementation of a user-agent behavior that
   * should be natively supported by major web browsers, but at this time, only
   * Firefox has a built-in protection.
   *
   * A form value-based approach ensures that the constraint is triggered for
   * consecutive, identical form submissions only. Compared to that, a form
   * button-based approach would (1) rely on [visible] buttons to exist where
   * technically not required and (2) require more complex state management if
   * there are multiple buttons in a form.
   *
   * This implementation is based on form-level submit events only and relies
   * on jQuery's serialize() method to determine submitted form values. As such,
   * the following limitations exist:
   *
   * - Event handlers on form buttons that preventDefault() do not receive a
   *   double-submit protection. That is deemed to be fine, since such button
   *   events typically trigger reversible client-side or server-side
   *   operations that are local to the context of a form only.
   * - Changed values in advanced form controls, such as file inputs, are not
   *   part of the form values being compared between consecutive form submits
   *   (due to limitations of jQuery.serialize()). That is deemed to be
   *   acceptable, because if the user forgot to attach a file, then the size of
   *   HTTP payload will most likely be small enough to be fully passed to the
   *   server endpoint within (milli)seconds. If a user mistakenly attached a
   *   wrong file and is technically versed enough to cancel the form submission
   *   (and HTTP payload) in order to attach a different file, then that
   *   edge-case is not supported here.
   *
   * Lastly, all forms submitted via HTTP GET are idempotent by definition of
   * HTTP standards, so excluded in this implementation.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.formSingleSubmit = {
    attach() {
      function onFormSubmit(e) {
        const $form = $(e.currentTarget);
        const formValues = $form.serialize();
        const previousValues = $form.attr('data-drupal-form-submit-last');
        if (previousValues === formValues) {
          e.preventDefault();
        } else {
          $form.attr('data-drupal-form-submit-last', formValues);
        }
      }

      $(once('form-single-submit', 'body')).on(
        'submit.singleSubmit',
        'form:not([method~="GET"])',
        onFormSubmit,
      );
    },
  };

  /**
   * Sends a 'formUpdated' event each time a form element is modified.
   *
   * @param {HTMLElement} element
   *   The element to trigger a form updated event on.
   *
   * @fires event:formUpdated
   */
  function triggerFormUpdated(element) {
    $(element).trigger('formUpdated');
  }

  /**
   * Collects the IDs of all form fields in the given form.
   *
   * @param {HTMLFormElement} form
   *   The form element to search.
   *
   * @return {Array}
   *   Array of IDs for form fields.
   */
  function fieldsList(form) {
    // We use id to avoid name duplicates on radio fields and filter out
    // elements with a name but no id.
    return [].map.call(form.querySelectorAll('[name][id]'), (el) => el.id);
  }

  /**
   * Triggers the 'formUpdated' event on form elements when they are modified.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches formUpdated behaviors.
   * @prop {Drupal~behaviorDetach} detach
   *   Detaches formUpdated behaviors.
   *
   * @fires event:formUpdated
   */
  Drupal.behaviors.formUpdated = {
    attach(context) {
      const $context = $(context);
      const contextIsForm = $context.is('form');
      const $forms = $(
        once('form-updated', contextIsForm ? $context : $context.find('form')),
      );
      let formFields;

      if ($forms.length) {
        // Initialize form behaviors, use $.makeArray to be able to use native
        // forEach array method and have the callback parameters in the right
        // order.
        $.makeArray($forms).forEach((form) => {
          const events = 'change.formUpdated input.formUpdated ';
          const eventHandler = debounce((event) => {
            triggerFormUpdated(event.target);
          }, 300);
          formFields = fieldsList(form).join(',');

          form.setAttribute('data-drupal-form-fields', formFields);
          $(form).on(events, eventHandler);
        });
      }
      // On ajax requests context is the form element.
      if (contextIsForm) {
        formFields = fieldsList(context).join(',');
        // @todo replace with form.getAttribute() when #1979468 is in.
        const currentFields = $(context).attr('data-drupal-form-fields');
        // If there has been a change in the fields or their order, trigger
        // formUpdated.
        if (formFields !== currentFields) {
          triggerFormUpdated(context);
        }
      }
    },
    detach(context, settings, trigger) {
      const $context = $(context);
      const contextIsForm = $context.is('form');
      if (trigger === 'unload') {
        once
          .remove(
            'form-updated',
            contextIsForm ? $context : $context.find('form'),
          )
          .forEach((form) => {
            form.removeAttribute('data-drupal-form-fields');
            $(form).off('.formUpdated');
          });
      }
    },
  };

  /**
   * Prepopulate form fields with information from the visitor browser.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for filling user info from browser.
   */
  Drupal.behaviors.fillUserInfoFromBrowser = {
    attach(context, settings) {
      const userInfo = ['name', 'mail', 'homepage'];
      const $forms = $(
        once('user-info-from-browser', '[data-user-info-from-browser]'),
      );
      if ($forms.length) {
        userInfo.forEach((info) => {
          const $element = $forms.find(`[name=${info}]`);
          const browserData = localStorage.getItem(`Drupal.visitor.${info}`);
          if (!$element.length) {
            return;
          }
          const emptyValue = $element[0].value === '';
          const defaultValue =
            $element.attr('data-drupal-default-value') === $element[0].value;
          if (browserData && (emptyValue || defaultValue)) {
            $element.each(function (index, item) {
              item.value = browserData;
            });
          }
        });
      }
      $forms.on('submit', () => {
        userInfo.forEach((info) => {
          const $element = $forms.find(`[name=${info}]`);
          if ($element.length) {
            localStorage.setItem(`Drupal.visitor.${info}`, $element[0].value);
          }
        });
      });
    },
  };

  /**
   * Sends a fragment interaction event on a hash change or fragment link click.
   *
   * @param {jQuery.Event} e
   *   The event triggered.
   *
   * @fires event:formFragmentLinkClickOrHashChange
   */
  const handleFragmentLinkClickOrHashChange = (e) => {
    let url;
    if (e.type === 'click') {
      url = e.currentTarget.location
        ? e.currentTarget.location
        : e.currentTarget;
    } else {
      url = window.location;
    }
    const hash = url.hash.substr(1);
    if (hash) {
      const $target = $(`#${hash}`);
      $('body').trigger('formFragmentLinkClickOrHashChange', [$target]);

      /**
       * Clicking a fragment link or a hash change should focus the target
       * element, but event timing issues in multiple browsers require a timeout.
       */
      setTimeout(() => $target.trigger('focus'), 300);
    }
  };

  const debouncedHandleFragmentLinkClickOrHashChange = debounce(
    handleFragmentLinkClickOrHashChange,
    300,
    true,
  );

  // Binds a listener to handle URL fragment changes.
  $(window).on(
    'hashchange.form-fragment',
    debouncedHandleFragmentLinkClickOrHashChange,
  );

  /**
   * Binds a listener to handle clicks on fragment links and absolute URL links
   * containing a fragment, this is needed next to the hash change listener
   * because clicking such links doesn't trigger a hash change when the fragment
   * is already in the URL.
   */
  $(document).on(
    'click.form-fragment',
    'a[href*="#"]',
    debouncedHandleFragmentLinkClickOrHashChange,
  );
})(jQuery, Drupal, Drupal.debounce);
;
/**
 * @file
 * Webform behaviors.
 */

(function ($, Drupal) {

  'use strict';

  // Trigger Drupal's attaching of behaviors after the page is
  // completely loaded.
  // @see https://stackoverflow.com/questions/37838430/detect-if-page-is-load-from-back-button
  // @see https://stackoverflow.com/questions/20899274/how-to-refresh-page-on-back-button-click/20899422#20899422
  var isChrome = (/chrom(e|ium)/.test(window.navigator.userAgent.toLowerCase()));
  if (isChrome) {
    // Track back button in navigation.
    // @see https://stackoverflow.com/questions/37838430/detect-if-page-is-load-from-back-button
    var backButton = false;
    if (window.performance) {
      var navEntries = window.performance.getEntriesByType('navigation');
      if (navEntries.length > 0 && navEntries[0].type === 'back_forward') {
        backButton = true;
      }
      else if (window.performance.navigation
        && window.performance.navigation.type === window.performance.navigation.TYPE_BACK_FORWARD) {
        backButton = true;
      }
    }

    // If the back button is pressed, delay Drupal's attaching of behaviors.
    if (backButton) {
      var attachBehaviors = Drupal.attachBehaviors;
      Drupal.attachBehaviors = function (context, settings) {
        setTimeout(function (context, settings) {
          attachBehaviors(context, settings);
        }, 300);
      };
    }
  }

})(jQuery, Drupal);
;
/**
 * @file
 * Drupal's states library.
 */

(function ($, Drupal) {
  /**
   * The base States namespace.
   *
   * Having the local states variable allows us to use the States namespace
   * without having to always declare "Drupal.states".
   *
   * @namespace Drupal.states
   */
  const states = {
    /**
     * An array of functions that should be postponed.
     */
    postponed: [],
  };

  Drupal.states = states;

  /**
   * Inverts a (if it's not undefined) when invertState is true.
   *
   * @function Drupal.states~invert
   *
   * @param {*} a
   *   The value to maybe invert.
   * @param {boolean} invertState
   *   Whether to invert state or not.
   *
   * @return {boolean}
   *   The result.
   */
  function invert(a, invertState) {
    return invertState && typeof a !== 'undefined' ? !a : a;
  }

  /**
   * Compares two values while ignoring undefined values.
   *
   * @function Drupal.states~compare
   *
   * @param {*} a
   *   Value a.
   * @param {*} b
   *   Value b.
   *
   * @return {boolean}
   *   The comparison result.
   */
  function compare(a, b) {
    if (a === b) {
      return typeof a === 'undefined' ? a : true;
    }

    return typeof a === 'undefined' || typeof b === 'undefined';
  }

  /**
   * Bitwise AND with a third undefined state.
   *
   * @function Drupal.states~ternary
   *
   * @param {*} a
   *   Value a.
   * @param {*} b
   *   Value b
   *
   * @return {boolean}
   *   The result.
   */
  function ternary(a, b) {
    if (typeof a === 'undefined') {
      return b;
    }
    if (typeof b === 'undefined') {
      return a;
    }

    return a && b;
  }

  /**
   * Attaches the states.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches states behaviors.
   */
  Drupal.behaviors.states = {
    attach(context, settings) {
      const $states = $(context).find('[data-drupal-states]');
      const il = $states.length;
      for (let i = 0; i < il; i++) {
        const config = JSON.parse(
          $states[i].getAttribute('data-drupal-states'),
        );
        Object.keys(config || {}).forEach((state) => {
          new states.Dependent({
            element: $($states[i]),
            state: states.State.sanitize(state),
            constraints: config[state],
          });
        });
      }

      // Execute all postponed functions now.
      while (states.postponed.length) {
        states.postponed.shift()();
      }
    },
  };

  /**
   * Object representing an element that depends on other elements.
   *
   * @constructor Drupal.states.Dependent
   *
   * @param {object} args
   *   Object with the following keys (all of which are required)
   * @param {jQuery} args.element
   *   A jQuery object of the dependent element
   * @param {Drupal.states.State} args.state
   *   A State object describing the state that is dependent
   * @param {object} args.constraints
   *   An object with dependency specifications. Lists all elements that this
   *   element depends on. It can be nested and can contain
   *   arbitrary AND and OR clauses.
   */
  states.Dependent = function (args) {
    $.extend(this, { values: {}, oldValue: null }, args);

    this.dependees = this.getDependees();
    Object.keys(this.dependees || {}).forEach((selector) => {
      this.initializeDependee(selector, this.dependees[selector]);
    });
  };

  /**
   * Comparison functions for comparing the value of an element with the
   * specification from the dependency settings. If the object type can't be
   * found in this list, the === operator is used by default.
   *
   * @name Drupal.states.Dependent.comparisons
   *
   * @prop {function} RegExp
   * @prop {function} Function
   * @prop {function} Number
   */
  states.Dependent.comparisons = {
    RegExp(reference, value) {
      return reference.test(value);
    },
    Function(reference, value) {
      // The "reference" variable is a comparison function.
      return reference(value);
    },
    Number(reference, value) {
      // If "reference" is a number and "value" is a string, then cast
      // reference as a string before applying the strict comparison in
      // compare().
      // Otherwise numeric keys in the form's #states array fail to match
      // string values returned from jQuery's val().
      return typeof value === 'string'
        ? compare(reference.toString(), value)
        : compare(reference, value);
    },
  };

  states.Dependent.prototype = {
    /**
     * Initializes one of the elements this dependent depends on.
     *
     * @memberof Drupal.states.Dependent#
     *
     * @param {string} selector
     *   The CSS selector describing the dependee.
     * @param {object} dependeeStates
     *   The list of states that have to be monitored for tracking the
     *   dependee's compliance status.
     */
    initializeDependee(selector, dependeeStates) {
      // Cache for the states of this dependee.
      this.values[selector] = {};

      Object.keys(dependeeStates).forEach((i) => {
        let state = dependeeStates[i];
        // Make sure we're not initializing this selector/state combination
        // twice.
        if ($.inArray(state, dependeeStates) === -1) {
          return;
        }

        state = states.State.sanitize(state);

        // Initialize the value of this state.
        this.values[selector][state.name] = null;

        // Monitor state changes of the specified state for this dependee.
        $(selector).on(`state:${state}`, { selector, state }, (e) => {
          this.update(e.data.selector, e.data.state, e.value);
        });

        // Make sure the event we just bound ourselves to is actually fired.
        new states.Trigger({ selector, state });
      });
    },

    /**
     * Compares a value with a reference value.
     *
     * @memberof Drupal.states.Dependent#
     *
     * @param {object} reference
     *   The value used for reference.
     * @param {string} selector
     *   CSS selector describing the dependee.
     * @param {Drupal.states.State} state
     *   A State object describing the dependee's updated state.
     *
     * @return {boolean}
     *   true or false.
     */
    compare(reference, selector, state) {
      const value = this.values[selector][state.name];
      if (reference.constructor.name in states.Dependent.comparisons) {
        // Use a custom compare function for certain reference value types.
        return states.Dependent.comparisons[reference.constructor.name](
          reference,
          value,
        );
      }

      // Do a plain comparison otherwise.
      return compare(reference, value);
    },

    /**
     * Update the value of a dependee's state.
     *
     * @memberof Drupal.states.Dependent#
     *
     * @param {string} selector
     *   CSS selector describing the dependee.
     * @param {Drupal.states.state} state
     *   A State object describing the dependee's updated state.
     * @param {string} value
     *   The new value for the dependee's updated state.
     */
    update(selector, state, value) {
      // Only act when the 'new' value is actually new.
      if (value !== this.values[selector][state.name]) {
        this.values[selector][state.name] = value;
        this.reevaluate();
      }
    },

    /**
     * Triggers change events in case a state changed.
     *
     * @memberof Drupal.states.Dependent#
     */
    reevaluate() {
      // Check whether any constraint for this dependent state is satisfied.
      let value = this.verifyConstraints(this.constraints);

      // Only invoke a state change event when the value actually changed.
      if (value !== this.oldValue) {
        // Store the new value so that we can compare later whether the value
        // actually changed.
        this.oldValue = value;

        // Normalize the value to match the normalized state name.
        value = invert(value, this.state.invert);

        // By adding "trigger: true", we ensure that state changes don't go into
        // infinite loops.
        this.element.trigger({
          type: `state:${this.state}`,
          value,
          trigger: true,
        });
      }
    },

    /**
     * Evaluates child constraints to determine if a constraint is satisfied.
     *
     * @memberof Drupal.states.Dependent#
     *
     * @param {object|Array} constraints
     *   A constraint object or an array of constraints.
     * @param {string} selector
     *   The selector for these constraints. If undefined, there isn't yet a
     *   selector that these constraints apply to. In that case, the keys of the
     *   object are interpreted as the selector if encountered.
     *
     * @return {boolean}
     *   true or false, depending on whether these constraints are satisfied.
     */
    verifyConstraints(constraints, selector) {
      let result;
      if ($.isArray(constraints)) {
        // This constraint is an array (OR or XOR).
        const hasXor = $.inArray('xor', constraints) === -1;
        const len = constraints.length;
        for (let i = 0; i < len; i++) {
          if (constraints[i] !== 'xor') {
            const constraint = this.checkConstraints(
              constraints[i],
              selector,
              i,
            );
            // Return if this is OR and we have a satisfied constraint or if
            // this is XOR and we have a second satisfied constraint.
            if (constraint && (hasXor || result)) {
              return hasXor;
            }
            result = result || constraint;
          }
        }
      }
      // Make sure we don't try to iterate over things other than objects. This
      // shouldn't normally occur, but in case the condition definition is
      // bogus, we don't want to end up with an infinite loop.
      else if ($.isPlainObject(constraints)) {
        // This constraint is an object (AND).
        // eslint-disable-next-line no-restricted-syntax
        for (const n in constraints) {
          if (constraints.hasOwnProperty(n)) {
            result = ternary(
              result,
              this.checkConstraints(constraints[n], selector, n),
            );
            // False and anything else will evaluate to false, so return when
            // any false condition is found.
            if (result === false) {
              return false;
            }
          }
        }
      }
      return result;
    },

    /**
     * Checks whether the value matches the requirements for this constraint.
     *
     * @memberof Drupal.states.Dependent#
     *
     * @param {string|Array|object} value
     *   Either the value of a state or an array/object of constraints. In the
     *   latter case, resolving the constraint continues.
     * @param {string} [selector]
     *   The selector for this constraint. If undefined, there isn't yet a
     *   selector that this constraint applies to. In that case, the state key
     *   is propagates to a selector and resolving continues.
     * @param {Drupal.states.State} [state]
     *   The state to check for this constraint. If undefined, resolving
     *   continues. If both selector and state aren't undefined and valid
     *   non-numeric strings, a lookup for the actual value of that selector's
     *   state is performed. This parameter is not a State object but a pristine
     *   state string.
     *
     * @return {boolean}
     *   true or false, depending on whether this constraint is satisfied.
     */
    checkConstraints(value, selector, state) {
      // Normalize the last parameter. If it's non-numeric, we treat it either
      // as a selector (in case there isn't one yet) or as a trigger/state.
      if (typeof state !== 'string' || /[0-9]/.test(state[0])) {
        state = null;
      } else if (typeof selector === 'undefined') {
        // Propagate the state to the selector when there isn't one yet.
        selector = state;
        state = null;
      }

      if (state !== null) {
        // Constraints is the actual constraints of an element to check for.
        state = states.State.sanitize(state);
        return invert(this.compare(value, selector, state), state.invert);
      }

      // Resolve this constraint as an AND/OR operator.
      return this.verifyConstraints(value, selector);
    },

    /**
     * Gathers information about all required triggers.
     *
     * @memberof Drupal.states.Dependent#
     *
     * @return {object}
     *   An object describing the required triggers.
     */
    getDependees() {
      const cache = {};
      // Swivel the lookup function so that we can record all available
      // selector- state combinations for initialization.
      const _compare = this.compare;
      this.compare = function (reference, selector, state) {
        (cache[selector] || (cache[selector] = [])).push(state.name);
        // Return nothing (=== undefined) so that the constraint loops are not
        // broken.
      };

      // This call doesn't actually verify anything but uses the resolving
      // mechanism to go through the constraints array, trying to look up each
      // value. Since we swivelled the compare function, this comparison returns
      // undefined and lookup continues until the very end. Instead of lookup up
      // the value, we record that combination of selector and state so that we
      // can initialize all triggers.
      this.verifyConstraints(this.constraints);
      // Restore the original function.
      this.compare = _compare;

      return cache;
    },
  };

  /**
   * @constructor Drupal.states.Trigger
   *
   * @param {object} args
   *   Trigger arguments.
   */
  states.Trigger = function (args) {
    $.extend(this, args);

    if (this.state in states.Trigger.states) {
      this.element = $(this.selector);

      // Only call the trigger initializer when it wasn't yet attached to this
      // element. Otherwise we'd end up with duplicate events.
      if (!this.element.data(`trigger:${this.state}`)) {
        this.initialize();
      }
    }
  };

  states.Trigger.prototype = {
    /**
     * @memberof Drupal.states.Trigger#
     */
    initialize() {
      const trigger = states.Trigger.states[this.state];

      if (typeof trigger === 'function') {
        // We have a custom trigger initialization function.
        trigger.call(window, this.element);
      } else {
        Object.keys(trigger || {}).forEach((event) => {
          this.defaultTrigger(event, trigger[event]);
        });
      }

      // Mark this trigger as initialized for this element.
      this.element.data(`trigger:${this.state}`, true);
    },

    /**
     * @memberof Drupal.states.Trigger#
     *
     * @param {jQuery.Event} event
     *   The event triggered.
     * @param {function} valueFn
     *   The function to call.
     */
    defaultTrigger(event, valueFn) {
      let oldValue = valueFn.call(this.element);

      // Attach the event callback.
      this.element.on(
        event,
        $.proxy(function (e) {
          const value = valueFn.call(this.element, e);
          // Only trigger the event if the value has actually changed.
          if (oldValue !== value) {
            this.element.trigger({
              type: `state:${this.state}`,
              value,
              oldValue,
            });
            oldValue = value;
          }
        }, this),
      );

      states.postponed.push(
        $.proxy(function () {
          // Trigger the event once for initialization purposes.
          this.element.trigger({
            type: `state:${this.state}`,
            value: oldValue,
            oldValue: null,
          });
        }, this),
      );
    },
  };

  /**
   * This list of states contains functions that are used to monitor the state
   * of an element. Whenever an element depends on the state of another element,
   * one of these trigger functions is added to the dependee so that the
   * dependent element can be updated.
   *
   * @name Drupal.states.Trigger.states
   *
   * @prop empty
   * @prop checked
   * @prop value
   * @prop collapsed
   */
  states.Trigger.states = {
    // 'empty' describes the state to be monitored.
    empty: {
      // 'keyup' is the (native DOM) event that we watch for.
      keyup() {
        // The function associated with that trigger returns the new value for
        // the state.
        return this.val() === '';
      },
    },

    checked: {
      change() {
        // prop() and attr() only takes the first element into account. To
        // support selectors matching multiple checkboxes, iterate over all and
        // return whether any is checked.
        let checked = false;
        this.each(function () {
          // Use prop() here as we want a boolean of the checkbox state.
          // @see http://api.jquery.com/prop/
          checked = $(this).prop('checked');
          // Break the each() loop if this is checked.
          return !checked;
        });
        return checked;
      },
    },

    // For radio buttons, only return the value if the radio button is selected.
    value: {
      keyup() {
        // Radio buttons share the same :input[name="key"] selector.
        if (this.length > 1) {
          // Initial checked value of radios is undefined, so we return false.
          return this.filter(':checked').val() || false;
        }
        return this.val();
      },
      change() {
        // Radio buttons share the same :input[name="key"] selector.
        if (this.length > 1) {
          // Initial checked value of radios is undefined, so we return false.
          return this.filter(':checked').val() || false;
        }
        return this.val();
      },
    },

    collapsed: {
      collapsed(e) {
        return typeof e !== 'undefined' && 'value' in e
          ? e.value
          : !this.is('[open]');
      },
    },
  };

  /**
   * A state object is used for describing the state and performing aliasing.
   *
   * @constructor Drupal.states.State
   *
   * @param {string} state
   *   The name of the state.
   */
  states.State = function (state) {
    /**
     * Original unresolved name.
     */
    this.pristine = state;
    this.name = state;

    // Normalize the state name.
    let process = true;
    do {
      // Iteratively remove exclamation marks and invert the value.
      while (this.name.charAt(0) === '!') {
        this.name = this.name.substring(1);
        this.invert = !this.invert;
      }

      // Replace the state with its normalized name.
      if (this.name in states.State.aliases) {
        this.name = states.State.aliases[this.name];
      } else {
        process = false;
      }
    } while (process);
  };

  /**
   * Creates a new State object by sanitizing the passed value.
   *
   * @name Drupal.states.State.sanitize
   *
   * @param {string|Drupal.states.State} state
   *   A state object or the name of a state.
   *
   * @return {Drupal.states.state}
   *   A state object.
   */
  states.State.sanitize = function (state) {
    if (state instanceof states.State) {
      return state;
    }

    return new states.State(state);
  };

  /**
   * This list of aliases is used to normalize states and associates negated
   * names with their respective inverse state.
   *
   * @name Drupal.states.State.aliases
   */
  states.State.aliases = {
    enabled: '!disabled',
    invisible: '!visible',
    invalid: '!valid',
    untouched: '!touched',
    optional: '!required',
    filled: '!empty',
    unchecked: '!checked',
    irrelevant: '!relevant',
    expanded: '!collapsed',
    open: '!collapsed',
    closed: 'collapsed',
    readwrite: '!readonly',
  };

  states.State.prototype = {
    /**
     * @memberof Drupal.states.State#
     */
    invert: false,

    /**
     * Ensures that just using the state object returns the name.
     *
     * @memberof Drupal.states.State#
     *
     * @return {string}
     *   The name of the state.
     */
    toString() {
      return this.name;
    },
  };

  /**
   * Global state change handlers. These are bound to "document" to cover all
   * elements whose state changes. Events sent to elements within the page
   * bubble up to these handlers. We use this system so that themes and modules
   * can override these state change handlers for particular parts of a page.
   */

  const $document = $(document);
  $document.on('state:disabled', (e) => {
    // Only act when this change was triggered by a dependency and not by the
    // element monitoring itself.
    if (e.trigger) {
      $(e.target)
        .prop('disabled', e.value)
        .closest('.js-form-item, .js-form-submit, .js-form-wrapper')
        .toggleClass('form-disabled', e.value)
        .find('select, input, textarea')
        .prop('disabled', e.value);

      // Note: WebKit nightlies don't reflect that change correctly.
      // See https://bugs.webkit.org/show_bug.cgi?id=23789
    }
  });

  $document.on('state:required', (e) => {
    if (e.trigger) {
      if (e.value) {
        const label = `label${e.target.id ? `[for=${e.target.id}]` : ''}`;
        const $label = $(e.target)
          .attr({ required: 'required', 'aria-required': 'true' })
          .closest('.js-form-item, .js-form-wrapper')
          .find(label);
        // Avoids duplicate required markers on initialization.
        if (!$label.hasClass('js-form-required').length) {
          $label.addClass('js-form-required form-required');
        }
      } else {
        $(e.target)
          .removeAttr('required aria-required')
          .closest('.js-form-item, .js-form-wrapper')
          .find('label.js-form-required')
          .removeClass('js-form-required form-required');
      }
    }
  });

  $document.on('state:visible', (e) => {
    if (e.trigger) {
      $(e.target)
        .closest('.js-form-item, .js-form-submit, .js-form-wrapper')
        .toggle(e.value);
    }
  });

  $document.on('state:checked', (e) => {
    if (e.trigger) {
      $(e.target).prop('checked', e.value);
    }
  });

  $document.on('state:collapsed', (e) => {
    if (e.trigger) {
      if ($(e.target).is('[open]') === e.value) {
        $(e.target).find('> summary').trigger('click');
      }
    }
  });
})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for custom webform #states.
 */

(function ($, Drupal, once) {

  'use strict';

  Drupal.webform = Drupal.webform || {};
  Drupal.webform.states = Drupal.webform.states || {};
  Drupal.webform.states.slideDown = Drupal.webform.states.slideDown || {};
  Drupal.webform.states.slideDown.duration = 'slow';
  Drupal.webform.states.slideUp = Drupal.webform.states.slideUp || {};
  Drupal.webform.states.slideUp.duration = 'fast';

  /* ************************************************************************ */
  // jQuery functions.
  /* ************************************************************************ */

  /**
   * Check if an element has a specified data attribute.
   *
   * @param {string} data
   *   The data attribute name.
   *
   * @return {boolean}
   *   TRUE if an element has a specified data attribute.
   */
  $.fn.hasData = function (data) {
    return (typeof this.data(data) !== 'undefined');
  };

  /**
   * Check if element is within the webform or not.
   *
   * @return {boolean}
   *   TRUE if element is within the webform.
   */
  $.fn.isWebform = function () {
    return $(this).closest('form.webform-submission-form, form[id^="webform"], form[data-is-webform]').length ? true : false;
  };

  /**
   * Check if element is to be treated as a webform element.
   *
   * @return {boolean}
   *   TRUE if element is to be treated as a webform element.
   */
  $.fn.isWebformElement = function () {
    return ($(this).isWebform() || $(this).closest('[data-is-webform-element]').length) ? true : false;
  };

  /* ************************************************************************ */
  // Trigger.
  /* ************************************************************************ */

  // The change event is triggered by cut-n-paste and select menus.
  // Issue #2445271: #states element empty check not triggered on mouse
  // based paste.
  // @see https://www.drupal.org/node/2445271
  Drupal.states.Trigger.states.empty.change = function change() {
    return this.val() === '';
  };

  /* ************************************************************************ */
  // Dependents.
  /* ************************************************************************ */

  // Apply solution included in #1962800 patch.
  // Issue #1962800: Form #states not working with literal integers as
  // values in IE11.
  // @see https://www.drupal.org/project/drupal/issues/1962800
  // @see https://www.drupal.org/files/issues/core-states-not-working-with-integers-ie11_1962800_46.patch
  //
  // This issue causes pattern, less than, and greater than support to break.
  // @see https://www.drupal.org/project/webform/issues/2981724
  var states = Drupal.states;
  Drupal.states.Dependent.prototype.compare = function compare(reference, selector, state) {
    var value = this.values[selector][state.name];

    var name = reference.constructor.name;
    if (!name) {
      name = $.type(reference);

      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    if (name in states.Dependent.comparisons) {
      return states.Dependent.comparisons[name](reference, value);
    }

    if (reference.constructor.name in states.Dependent.comparisons) {
      return states.Dependent.comparisons[reference.constructor.name](reference, value);
    }

    return _compare2(reference, value);
  };
  function _compare2(a, b) {
    if (a === b) {
      return typeof a === 'undefined' ? a : true;
    }

    return typeof a === 'undefined' || typeof b === 'undefined';
  }

  // Adds pattern, less than, and greater than support to #state API.
  // @see http://drupalsun.com/julia-evans/2012/03/09/extending-form-api-states-regular-expressions
  Drupal.states.Dependent.comparisons.Object = function (reference, value) {
    if ('pattern' in reference) {
      return (new RegExp(reference['pattern'])).test(value);
    }
    else if ('!pattern' in reference) {
      return !((new RegExp(reference['!pattern'])).test(value));
    }
    else if ('less' in reference) {
      return (value !== '' && parseFloat(reference['less']) > parseFloat(value));
    }
    else if ('less_equal' in reference) {
      return (value !== '' && parseFloat(reference['less_equal']) >= parseFloat(value));
    }
    else if ('greater' in reference) {
      return (value !== '' && parseFloat(reference['greater']) < parseFloat(value));
    }
    else if ('greater_equal' in reference) {
      return (value !== '' && parseFloat(reference['greater_equal']) <= parseFloat(value));
    }
    else if ('between' in reference || '!between' in reference) {
      if (value === '') {
        return false;
      }

      var between = reference['between'] || reference['!between'];
      var betweenParts = between.split(':');
      var greater = betweenParts[0];
      var less = (typeof betweenParts[1] !== 'undefined') ? betweenParts[1] : null;
      var isGreaterThan = (greater === null || greater === '' || parseFloat(value) >= parseFloat(greater));
      var isLessThan = (less === null || less === '' || parseFloat(value) <= parseFloat(less));
      var result = (isGreaterThan && isLessThan);
      return (reference['!between']) ? !result : result;
    }
    else {
      return reference.indexOf(value) !== false;
    }
  };

  /* ************************************************************************ */
  // States events.
  /* ************************************************************************ */

  var $document = $(document);

  $document.on('state:required', function (e) {
    if (e.trigger && $(e.target).isWebformElement()) {
      var $target = $(e.target);
      // Fix #required file upload.
      // @see Issue #2860529: Conditional required File upload field don't work.
      toggleRequired($target.find('input[type="file"]'), e.value);

      // Fix #required for radios and likert.
      // @see Issue #2856795: If radio buttons are required but not filled form is nevertheless submitted.
      if ($target.is('.js-form-type-radios, .js-form-type-webform-radios-other, .js-webform-type-radios, .js-webform-type-webform-radios-other, .js-webform-type-webform-entity-radios, .webform-likert-table')) {
        $target.toggleClass('required', e.value);
        toggleRequired($target.find('input[type="radio"]'), e.value);
      }

      // Fix #required for checkboxes.
      // @see Issue #2938414: Checkboxes don't support #states required.
      // @see checkboxRequiredhandler
      if ($target.is('.js-form-type-checkboxes, .js-form-type-webform-checkboxes-other, .js-webform-type-checkboxes, .js-webform-type-webform-checkboxes-other')) {
        $target.toggleClass('required', e.value);
        var $checkboxes = $target.find('input[type="checkbox"]');
        if (e.value) {
          // Add event handler.
          $checkboxes.on('click', statesCheckboxesRequiredEventHandler);
          // Initialize and add required attribute.
          checkboxesRequired($target);
        }
        else {
          // Remove event handler.
          $checkboxes.off('click', statesCheckboxesRequiredEventHandler);
          // Remove required attribute.
          toggleRequired($checkboxes, false);
        }
      }

      // Fix #required for tableselect.
      // @see Issue #3212581: Table select does not trigger client side validation
      if ($target.is('.js-webform-tableselect')) {
        $target.toggleClass('required', e.value);
        var isMultiple = $target.is('[multiple]');
        if (isMultiple) {
          // Checkboxes.
          var $tbody = $target.find('tbody');
          var $checkboxes = $tbody.find('input[type="checkbox"]');
          copyRequireMessage($target, $checkboxes);
          if (e.value) {
            $checkboxes.on('click change', statesCheckboxesRequiredEventHandler);
            checkboxesRequired($tbody);
          }
          else {
            $checkboxes.off('click change ', statesCheckboxesRequiredEventHandler);
            toggleRequired($tbody, false);
          }
        }
        else {
          // Radios.
          var $radios = $target.find('input[type="radio"]');
          copyRequireMessage($target, $radios);
          toggleRequired($radios, e.value);
        }
      }

      // Fix required label for elements without the for attribute.
      // @see Issue #3145300: Conditional Visible Select Other not working.
      if ($target.is('.js-form-type-webform-select-other, .js-webform-type-webform-select-other')) {
        var $select = $target.find('select');
        toggleRequired($select, e.value);
        copyRequireMessage($target, $select);
      }
      if ($target.find('> label:not([for])').length) {
        $target.find('> label').toggleClass('js-form-required form-required', e.value);
      }

      // Fix required label for checkboxes and radios.
      // @see Issue #2938414: Checkboxes don't support #states required
      // @see Issue #2731991: Setting required on radios marks all options required.
      // @see Issue #2856315: Conditional Logic - Requiring Radios in a Fieldset.
      // Fix #required for fieldsets.
      // @see Issue #2977569: Hidden fieldsets that become visible with conditional logic cannot be made required.
      if ($target.is('.js-webform-type-radios, .js-webform-type-checkboxes, fieldset')) {
        $target.find('legend span.fieldset-legend:not(.visually-hidden),legend span.fieldset__label:not(.visually-hidden)').toggleClass('js-form-required form-required', e.value);
      }

      // Issue #2986017: Fieldsets shouldn't have required attribute.
      if ($target.is('fieldset')) {
        $target.removeAttr('required aria-required');
      }
    }
  });

  $document.on('state:checked', function (e) {
    if (e.trigger) {
      $(e.target).trigger('change');
    }
  });

  $document.on('state:readonly', function (e) {
    if (e.trigger && $(e.target).isWebformElement()) {
      $(e.target).prop('readonly', e.value).closest('.js-form-item, .js-form-wrapper').toggleClass('webform-readonly', e.value).find('input, textarea').prop('readonly', e.value);

      // Trigger webform:readonly.
      $(e.target).trigger('webform:readonly')
        .find('select, input, textarea, button').trigger('webform:readonly');
    }
  });

  $document.on('state:visible state:visible-slide', function (e) {
    if (e.trigger && $(e.target).isWebformElement()) {
      if (e.value) {
        $(':input', e.target).addBack().each(function () {
          restoreValueAndRequired(this);
          triggerEventHandlers(this);
        });
      }
      else {
        // @see https://www.sitepoint.com/jquery-function-clear-form-data/
        $(':input', e.target).addBack().each(function () {
          backupValueAndRequired(this);
          clearValueAndRequired(this);
          triggerEventHandlers(this);
        });
      }
    }
  });

  $document.on('state:visible-slide', function (e) {
    if (e.trigger && $(e.target).isWebformElement()) {
      var effect = e.value ? 'slideDown' : 'slideUp';
      var duration = Drupal.webform.states[effect].duration;
      $(e.target).closest('.js-form-item, .js-form-submit, .js-form-wrapper')[effect](duration);
    }
  });
  Drupal.states.State.aliases['invisible-slide'] = '!visible-slide';

  $document.on('state:disabled', function (e) {
    if (e.trigger && $(e.target).isWebformElement()) {
      // Make sure disabled property is set before triggering webform:disabled.
      // Copied from: core/misc/states.js
      $(e.target)
        .prop('disabled', e.value)
        .closest('.js-form-item, .js-form-submit, .js-form-wrapper').toggleClass('form-disabled', e.value)
        .find('select, input, textarea, button').prop('disabled', e.value);

      // Never disable hidden file[fids] because the existing values will
      // be completely lost when the webform is submitted.
      var fileElements = $(e.target)
        .find(':input[type="hidden"][name$="[fids]"]');
      if (fileElements.length) {
        // Remove 'disabled' attribute from fieldset which will block
        // all disabled elements from being submitted.
        if ($(e.target).is('fieldset')) {
          $(e.target).prop('disabled', false);
        }
        fileElements.removeAttr('disabled');
      }

      // Trigger webform:disabled.
      $(e.target).trigger('webform:disabled')
        .find('select, input, textarea, button').trigger('webform:disabled');
    }
  });

  /* ************************************************************************ */
  // Behaviors.
  /* ************************************************************************ */

  /**
   * Adds HTML5 validation to required checkboxes.
   *
   * @type {Drupal~behavior}
   *
   * @see https://www.drupal.org/project/webform/issues/3068998
   */
  Drupal.behaviors.webformCheckboxesRequired = {
    attach: function (context) {
      $(once('webform-checkboxes-required', '.js-form-type-checkboxes.required, .js-form-type-webform-checkboxes-other.required, .js-webform-type-checkboxes.required, .js-webform-type-webform-checkboxes-other.required, .js-webform-type-webform-radios-other.checkboxes', context))
        .each(function () {
          var $element = $(this);
          $element.find('input[type="checkbox"]').on('click', statesCheckboxesRequiredEventHandler);
          setTimeout(function () {checkboxesRequired($element);});
        });
    }
  };

  /**
   * Adds HTML5 validation to required radios.
   *
   * @type {Drupal~behavior}
   *
   * @see https://www.drupal.org/project/webform/issues/2856795
   */
  Drupal.behaviors.webformRadiosRequired = {
    attach: function (context) {
      $(once('webform-radios-required', '.js-form-type-radios, .js-form-type-webform-radios-other, .js-webform-type-radios, .js-webform-type-webform-radios-other, .js-webform-type-webform-entity-radios, .js-webform-type-webform-scale', context))
        .each(function () {
          var $element = $(this);
          setTimeout(function () {radiosRequired($element);});
        });
    }
  };

 /**
   * Adds HTML5 validation to required table select.
   *
   * @type {Drupal~behavior}
   *
   * @see https://www.drupal.org/project/webform/issues/2856795
   */
  Drupal.behaviors.webformTableSelectRequired = {
    attach: function (context) {
      $(once('webform-tableselect-required','.js-webform-tableselect.required', context))
        .each(function () {
          var $element = $(this);
          var $tbody = $element.find('tbody');
          var isMultiple = $element.is('[multiple]');

          if (isMultiple) {
            // Check all checkbox triggers checkbox 'change' event on
            // select and deselect all.
            // @see Drupal.tableSelect
            $tbody.find('input[type="checkbox"]').on('click change', function () {
              checkboxesRequired($tbody);
            });
          }

          setTimeout(function () {
            isMultiple ? checkboxesRequired($tbody) : radiosRequired($element);
          });
        });
    }
  };

  /**
   * Add HTML5 multiple checkboxes required validation.
   *
   * @param {jQuery} $element
   *   An jQuery object containing HTML5 radios.
   *
   * @see https://stackoverflow.com/a/37825072/145846
   */
  function checkboxesRequired($element) {
    var $firstCheckbox = $element.find('input[type="checkbox"]').first();
    var isChecked = $element.find('input[type="checkbox"]').is(':checked');
    toggleRequired($firstCheckbox, !isChecked);
    copyRequireMessage($element, $firstCheckbox);
  }

  /**
   * Add HTML5 radios required validation.
   *
   * @param {jQuery} $element
   *   An jQuery object containing HTML5 radios.
   *
   * @see https://www.drupal.org/project/webform/issues/2856795
   */
  function radiosRequired($element) {
    var $radios = $element.find('input[type="radio"]');
    var isRequired = $element.hasClass('required');
    toggleRequired($radios, isRequired);
    copyRequireMessage($element, $radios);
  }

  /* ************************************************************************ */
  // Event handlers.
  /* ************************************************************************ */

  /**
   * Trigger #states API HTML5 multiple checkboxes required validation.
   *
   * @see https://stackoverflow.com/a/37825072/145846
   */
  function statesCheckboxesRequiredEventHandler() {
    var $element = $(this).closest('.js-webform-type-checkboxes, .js-webform-type-webform-checkboxes-other');
    checkboxesRequired($element);
  }

  /**
   * Trigger an input's event handlers.
   *
   * @param {element} input
   *   An input.
   */
  function triggerEventHandlers(input) {
    var $input = $(input);
    var type = input.type;
    var tag = input.tagName.toLowerCase();
    // Add 'webform.states' as extra parameter to event handlers.
    // @see Drupal.behaviors.webformUnsaved
    var extraParameters = ['webform.states'];
    if (type === 'checkbox' || type === 'radio') {
      $input
        .trigger('change', extraParameters)
        .trigger('blur', extraParameters);
    }
    else if (tag === 'select') {
      // Do not trigger the onchange event for Address element's country code
      // when it is initialized.
      // @see \Drupal\address\Element\Country
      if ($input.closest('.webform-type-address').length) {
        if (!$input.data('webform-states-address-initialized')
          && $input.attr('autocomplete') === 'country'
          && $input.val() === $input.find("option[selected]").attr('value')) {
          return;
        }
        $input.data('webform-states-address-initialized', true);
      }

      $input
        .trigger('change', extraParameters)
        .trigger('blur', extraParameters);
    }
    else if (type !== 'submit' && type !== 'button' && type !== 'file') {
      // Make sure input mask is removed and then reset when value is restored.
      // @see https://www.drupal.org/project/webform/issues/3124155
      // @see https://www.drupal.org/project/webform/issues/3202795
      var hasInputMask = ($.fn.inputmask && $input.hasClass('js-webform-input-mask'));
      hasInputMask && $input.inputmask('remove');

      $input
        .trigger('input', extraParameters)
        .trigger('change', extraParameters)
        .trigger('keydown', extraParameters)
        .trigger('keyup', extraParameters)
        .trigger('blur', extraParameters);

      hasInputMask && $input.inputmask();
    }
  }

  /* ************************************************************************ */
  // Backup and restore value functions.
  /* ************************************************************************ */

  /**
   * Backup an input's current value and required attribute
   *
   * @param {element} input
   *   An input.
   */
  function backupValueAndRequired(input) {
    var $input = $(input);
    var type = input.type;
    var tag = input.tagName.toLowerCase(); // Normalize case.

    // Backup required.
    if ($input.prop('required') && !$input.hasData('webform-required')) {
      $input.data('webform-required', true);
    }

    // Backup value.
    if (!$input.hasData('webform-value')) {
      if (type === 'checkbox' || type === 'radio') {
        $input.data('webform-value', $input.prop('checked'));
      }
      else if (tag === 'select') {
        var values = [];
        $input.find('option:selected').each(function (i, option) {
          values[i] = option.value;
        });
        $input.data('webform-value', values);
      }
      else if (type !== 'submit' && type !== 'button') {
        $input.data('webform-value', input.value);
      }
    }
  }

  /**
   * Restore an input's value and required attribute.
   *
   * @param {element} input
   *   An input.
   */
  function restoreValueAndRequired(input) {
    var $input = $(input);

    // Restore value.
    var value = $input.data('webform-value');
    if (typeof value !== 'undefined') {
      var type = input.type;
      var tag = input.tagName.toLowerCase(); // Normalize case.

      if (type === 'checkbox' || type === 'radio') {
        $input.prop('checked', value);
      }
      else if (tag === 'select') {
        $.each(value, function (i, option_value) {
          // Prevent "Syntax error, unrecognized expression" error by
          // escaping single quotes.
          // @see https://forum.jquery.com/topic/escape-characters-prior-to-using-selector
          option_value = option_value.replace(/'/g, "\\\'");
          $input.find("option[value='" + option_value + "']").prop('selected', true);
        });
      }
      else if (type !== 'submit' && type !== 'button') {
        input.value = value;
      }
      $input.removeData('webform-value');
    }

    // Restore required.
    var required = $input.data('webform-required');
    if (typeof required !== 'undefined') {
      if (required) {
        $input.prop('required', true);
      }
      $input.removeData('webform-required');
    }
  }

  /**
   * Clear an input's value and required attributes.
   *
   * @param {element} input
   *   An input.
   */
  function clearValueAndRequired(input) {
    var $input = $(input);

    // Check for #states no clear attribute.
    // @see https://css-tricks.com/snippets/jquery/make-an-jquery-hasattr/
    if ($input.closest('[data-webform-states-no-clear]').length) {
      return;
    }

    // Clear value.
    var type = input.type;
    var tag = input.tagName.toLowerCase(); // Normalize case.
    if (type === 'checkbox' || type === 'radio') {
      $input.prop('checked', false);
    }
    else if (tag === 'select') {
      if ($input.find('option[value=""]').length) {
        $input.val('');
      }
      else {
        input.selectedIndex = -1;
      }
    }
    else if (type !== 'submit' && type !== 'button') {
      input.value = (type === 'color') ? '#000000' : '';
    }

    // Clear required.
    $input.prop('required', false);
  }

  /* ************************************************************************ */
  // Helper functions.
  /* ************************************************************************ */

  /**
   * Toggle an input's required attributes.
   *
   * @param {element} $input
   *   An input.
   * @param {boolean} required
   *   Is input required.
   */
  function toggleRequired($input, required) {
    var isCheckboxOrRadio = ($input.attr('type') === 'radio' || $input.attr('type') === 'checkbox');
    if (required) {
      if (isCheckboxOrRadio) {
        $input.attr({'required': 'required'});
      }
      else {
        $input.attr({'required': 'required', 'aria-required': 'true'});
      }
    }
    else {
      if (isCheckboxOrRadio) {
        $input.removeAttr('required');
      }
      else {
        $input.removeAttr('required aria-required');
      }
    }
  }

  /**
   * Copy the clientside_validation.module's message.
   *
   * @param {jQuery} $source
   *   The source element.
   * @param {jQuery} $destination
   *   The destination element.
   */
  function copyRequireMessage($source, $destination) {
    if ($source.attr('data-msg-required')) {
      $destination.attr('data-msg-required', $source.attr('data-msg-required'));
    }
  }

})(jQuery, Drupal, once);
;
/**
 * @file
 * JavaScript behaviors for webforms.
 */

(function ($, Drupal, once) {

  'use strict';

  /**
   * Remove single submit event listener.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for removing single submit event listener.
   *
   * @see Drupal.behaviors.formSingleSubmit
   */
  Drupal.behaviors.webformRemoveFormSingleSubmit = {
    attach: function attach() {
      function onFormSubmit(e) {
        var $form = $(e.currentTarget);
        $form.removeAttr('data-drupal-form-submit-last');
      }
      $(once('webform-single-submit', 'body'))
        .on('submit.singleSubmit', 'form.webform-remove-single-submit', onFormSubmit);
    }
  };

  /**
   * Prevent webform autosubmit on wizard pages.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for disabling webform autosubmit.
   *   Wizard pages need to be progressed with the Previous or Next buttons,
   *   not by pressing Enter.
   */
  Drupal.behaviors.webformDisableAutoSubmit = {
    attach: function (context) {
      // Not using context so that inputs loaded via Ajax will have autosubmit
      // disabled.
      // @see http://stackoverflow.com/questions/11235622/jquery-disable-form-submit-on-enter
      $(once('webform-disable-autosubmit', $('.js-webform-disable-autosubmit input').not(':button, :submit, :reset, :image, :file')))
        .on('keyup keypress', function (e) {
          if (e.which === 13) {
            e.preventDefault();
            return false;
          }
        });
    }
  };

  /**
   * Custom required and pattern validation error messages.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the webform custom required and pattern
   *   validation error messages.
   *
   * @see http://stackoverflow.com/questions/5272433/html5-form-required-attribute-set-custom-validation-message
   **/
  Drupal.behaviors.webformRequiredError = {
    attach: function (context) {
      $(once('webform-required-error', $(context).find(':input[data-webform-required-error], :input[data-webform-pattern-error]')))
        .on('invalid', function () {
          this.setCustomValidity('');
          if (this.valid) {
            return;
          }

          if (this.validity.patternMismatch && $(this).attr('data-webform-pattern-error')) {
            this.setCustomValidity($(this).attr('data-webform-pattern-error'));
          }
          else if (this.validity.valueMissing && $(this).attr('data-webform-required-error')) {
            this.setCustomValidity($(this).attr('data-webform-required-error'));
          }
        })
        .on('input change', function () {
          // Find all related elements by name and reset custom validity.
          // This specifically applies to required radios and checkboxes.
          var name = $(this).attr('name');
          $(this.form).find(':input[name="' + name + '"]').each(function () {
            this.setCustomValidity('');
          });
        });
    }
  };

  // When #state:required is triggered we need to reset the target elements
  // custom validity.
  $(document).on('state:required', function (e) {
    $(e.target).filter(':input[data-webform-required-error]')
      .each(function () {this.setCustomValidity('');});
  });

})(jQuery, Drupal, once);
;
/**
 * @file
 * JavaScript behaviors for unsaved webforms.
 */

(function ($, Drupal, once) {

  'use strict';

  var unsaved = false;

  /**
   * Unsaved changes.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for unsaved changes.
   */
  Drupal.behaviors.webformUnsaved = {
    clear: function () {
      // Allow Ajax refresh/redirect to clear unsaved flag.
      // @see Drupal.AjaxCommands.prototype.webformRefresh
      unsaved = false;
    },
    get: function () {
      // Get the current unsaved flag state.
      return unsaved;
    },
    set: function (value) {
      // Set the current unsaved flag state.
      unsaved = value;
    },
    attach: function (context) {
      // Look for the 'data-webform-unsaved' attribute which indicates that
      // a multi-step webform has unsaved data.
      // @see \Drupal\webform\WebformSubmissionForm::buildForm
      if ($(once('data-webform-unsaved', '.js-webform-unsaved[data-webform-unsaved]')).length) {
        unsaved = true;
      }
      else {
        $(once('webform-unsaved', $('.js-webform-unsaved :input:not(:button, :submit, :reset, [type="hidden"])'))).on('change keypress', function (event, param1) {
          // Ignore events triggered when #states API is changed,
          // which passes 'webform.states' as param1.
          // @see webform.states.js ::triggerEventHandlers().
          if (param1 !== 'webform.states') {
            unsaved = true;
          }
        });
      }

      $(once('webform-unsaved', $('.js-webform-unsaved button, .js-webform-unsaved input[type="submit"]', context))).not('[data-webform-unsaved-ignore]')
        .on('click', function (event) {
          // For reset button we must confirm unsaved changes before the
          // before unload event handler.
          if ($(this).hasClass('webform-button--reset') && unsaved) {
            if (!window.confirm(Drupal.t('Changes you made may not be saved.') + '\n\n' + Drupal.t('Press OK to leave this page or Cancel to stay.'))) {
              return false;
            }
          }

          unsaved = false;
        });

      // Add submit handler to form.beforeSend.
      // Update Drupal.Ajax.prototype.beforeSend only once.
      if (typeof Drupal.Ajax !== 'undefined' && typeof Drupal.Ajax.prototype.beforeSubmitWebformUnsavedOriginal === 'undefined') {
        Drupal.Ajax.prototype.beforeSubmitWebformUnsavedOriginal = Drupal.Ajax.prototype.beforeSubmit;
        Drupal.Ajax.prototype.beforeSubmit = function (form_values, element_settings, options) {
          unsaved = false;
          return this.beforeSubmitWebformUnsavedOriginal.apply(this, arguments);
        };
      }

      // Track all CKEditor change events.
      // @see https://ckeditor.com/old/forums/Support/CKEditor-jQuery-change-event
      if (window.CKEDITOR && !CKEDITOR.webformUnsaved) {
        CKEDITOR.webformUnsaved = true;
        CKEDITOR.on('instanceCreated', function (event) {
          event.editor.on('change', function (evt) {
            unsaved = true;
          });
        });
      }
    }
  };

  $(window).on('beforeunload', function () {
    if (unsaved) {
      return true;
    }
  });

  /**
   * An experimental shim to partially emulate onBeforeUnload on iOS.
   * Part of https://github.com/codedance/jquery.AreYouSure/
   *
   * Copyright (c) 2012-2014, Chris Dance and PaperCut Software http://www.papercut.com/
   * Dual licensed under the MIT or GPL Version 2 licenses.
   * http://jquery.org/license
   *
   * Author:  chris.dance@papercut.com
   * Date:    19th May 2014
   */
  $(function () {
    // @see https://stackoverflow.com/questions/58019463/how-to-detect-device-name-in-safari-on-ios-13-while-it-doesnt-show-the-correct
    var isIOSorOpera = navigator.userAgent.toLowerCase().match(/iphone|ipad|ipod|opera/)
      || navigator.platform.toLowerCase().match(/iphone|ipad|ipod/)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isIOSorOpera) {
      return;
    }

    $('a:not(.use-ajax)').bind('click', function (evt) {
      var a = $(evt.target).closest('a');
      var href = a.attr('href');
      if (typeof href !== 'undefined' && !(href.match(/^#/) || href.trim() === '')) {
        if ($(window).triggerHandler('beforeunload')) {
          if (!window.confirm(Drupal.t('Changes you made may not be saved.') + '\n\n' + Drupal.t('Press OK to leave this page or Cancel to stay.'))) {
            return false;
          }
        }
        var target = a.attr('target');
        if (target) {
          window.open(href, target);
        }
        else {
          window.location.href = href;
        }
        return false;
      }
    });
  });

})(jQuery, Drupal, once);
;
/**
 * @file
 * JavaScript behaviors for details element.
 */

(function ($, Drupal, once) {

  'use strict';

  // Determine if local storage exists and is enabled.
  // This approach is copied from Modernizr.
  // @see https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731
  var hasLocalStorage = (function () {
    try {
      localStorage.setItem('webform', 'webform');
      localStorage.removeItem('webform');
      return true;
    }
    catch (e) {
      return false;
    }
  }());

  /**
   * Attach handler to save details open/close state.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformDetailsSave = {
    attach: function (context) {
      if (!hasLocalStorage) {
        return;
      }

      // Summary click event handler.
      $(once('webform-details-summary-save', 'details > summary', context)).on('click', function () {
        var $details = $(this).parent();

        // @see https://css-tricks.com/snippets/jquery/make-an-jquery-hasattr/
        if ($details[0].hasAttribute('data-webform-details-nosave')) {
          return;
        }

        var name = Drupal.webformDetailsSaveGetName($details);
        if (!name) {
          return;
        }

        var open = ($details.attr('open') !== 'open') ? '1' : '0';
        localStorage.setItem(name, open);
      });

      // Initialize details open state via local storage.
      $(once('webform-details-save', 'details', context)).each(function () {
        var $details = $(this);

        var name = Drupal.webformDetailsSaveGetName($details);
        if (!name) {
          return;
        }

        var open = localStorage.getItem(name);
        if (open === null) {
          return;
        }

        if (open === '1') {
          $details.attr('open', 'open');
        }
        else {
          $details.removeAttr('open');
        }
      });
    }

  };

  /**
   * Get the name used to store the state of details element.
   *
   * @param {jQuery} $details
   *   A details element.
   *
   * @return {string}
   *   The name used to store the state of details element.
   */
  Drupal.webformDetailsSaveGetName = function ($details) {
    if (!hasLocalStorage) {
      return '';
    }

    // Ignore details that are vertical tabs pane.
    if ($details.hasClass('vertical-tabs__pane')) {
      return '';
    }

    // Any details element not included a webform must have define its own id.
    var webformId = $details.attr('data-webform-element-id');
    if (webformId) {
      return 'Drupal.webform.' + webformId.replace('--', '.');
    }

    var detailsId = $details.attr('id');
    if (!detailsId) {
      return '';
    }

    var $form = $details.parents('form');
    if (!$form.length || !$form.attr('id')) {
      return '';
    }

    var formId = $form.attr('id');
    if (!formId) {
      return '';
    }

    // ISSUE: When Drupal renders a webform in a modal dialog it appends a unique
    // identifier to webform ids and details ids. (i.e. my-form--FeSFISegTUI)
    // WORKAROUND: Remove the unique id that delimited using double dashes.
    formId = formId.replace(/--.+?$/, '').replace(/-/g, '_');
    detailsId = detailsId.replace(/--.+?$/, '').replace(/-/g, '_');
    return 'Drupal.webform.' + formId + '.' + detailsId;
  };

})(jQuery, Drupal, once);
;
/**
 * @file
 * JavaScript behaviors for details element.
 */

(function ($, Drupal, once) {

  'use strict';

  Drupal.webform = Drupal.webform || {};
  Drupal.webform.detailsToggle = Drupal.webform.detailsToggle || {};
  Drupal.webform.detailsToggle.options = Drupal.webform.detailsToggle.options || {};

  /**
   * Attach handler to toggle details open/close state.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformDetailsToggle = {
    attach: function (context) {
      $(once('webform-details-toggle', '.js-webform-details-toggle', context)).each(function () {
        var $form = $(this);
        var $tabs = $form.find('.webform-tabs');

        // Get only the main details elements and ignore all nested details.
        var selector = ($tabs.length) ? '.webform-tab' : '.js-webform-details-toggle, .webform-elements';
        var $details = $form.find('details').filter(function () {
          var $parents = $(this).parentsUntil(selector);
          return ($parents.find('details').length === 0);
        });

        // Toggle is only useful when there are two or more details elements.
        if ($details.length < 2) {
          return;
        }

        var options = $.extend({
          button: '<button type="button" class="webform-details-toggle-state"></button>'
        }, Drupal.webform.detailsToggle.options);

        // Create toggle buttons.
        var $toggle = $(options.button)
          .attr('title', Drupal.t('Toggle details widget state.'))
          .on('click', function (e) {
            // Get details that are not vertical tabs pane.
            var $details = $form.find('details:not(.vertical-tabs__pane)');
            var open;
            if (Drupal.webform.detailsToggle.isFormDetailsOpen($form)) {
              $details.removeAttr('open');
              open = 0;
            }
            else {
              $details.attr('open', 'open');
              open = 1;
            }
            Drupal.webform.detailsToggle.setDetailsToggleLabel($form);

            // Set the saved states for all the details elements.
            // @see webform.element.details.save.js
            if (Drupal.webformDetailsSaveGetName) {
              $details.each(function () {
                // Note: Drupal.webformDetailsSaveGetName checks if localStorage
                // exists and is enabled.
                // @see webform.element.details.save.js
                var name = Drupal.webformDetailsSaveGetName($(this));
                if (name) {
                  localStorage.setItem(name, open);
                }
              });
            }
          })
          .wrap('<div class="webform-details-toggle-state-wrapper"></div>')
          .parent();

        if ($tabs.length) {
          // Add toggle state before the tabs.
          $tabs.find('.item-list:first-child').eq(0).before($toggle);
        }
        else {
          // Add toggle state link to first details element.
          $details.eq(0).before($toggle);
        }

        Drupal.webform.detailsToggle.setDetailsToggleLabel($form);
      });
    }
  };

  /**
   * Determine if a webform's details are all opened.
   *
   * @param {jQuery} $form
   *   A webform.
   *
   * @return {boolean}
   *   TRUE if a webform's details are all opened.
   */
  Drupal.webform.detailsToggle.isFormDetailsOpen = function ($form) {
    return ($form.find('details[open]').length === $form.find('details').length);
  };

  /**
   * Set a webform's details toggle state widget label.
   *
   * @param {jQuery} $form
   *   A webform.
   */
  Drupal.webform.detailsToggle.setDetailsToggleLabel = function ($form) {
    var isOpen = Drupal.webform.detailsToggle.isFormDetailsOpen($form);

    var label = (isOpen) ? Drupal.t('Collapse all') : Drupal.t('Expand all');
    $form.find('.webform-details-toggle-state').html(label);

    var text = (isOpen) ? Drupal.t('All details have been expanded.') : Drupal.t('All details have been collapsed.');
    Drupal.announce(text);
  };

})(jQuery, Drupal, once);
;
/**
 * @file
 * JavaScript behaviors for webform scroll top.
 */

(function ($, Drupal) {

  'use strict';

  Drupal.webform = Drupal.webform || {};
  // Allow scrollTopOffset to be custom defined or based on whether there is a
  // floating toolbar.
  Drupal.webform.scrollTopOffset = Drupal.webform.scrollTopOffset || ($('#toolbar-administration').length ? 140 : 10);

  /**
   * Scroll to top ajax command.
   *
   * @param {Element} element
   *   The element to scroll to.
   * @param {string} target
   *   Scroll to target. (form or page)
   */
  Drupal.webformScrollTop = function (element, target) {
    if (!target) {
      return;
    }

    var $element = $(element);

    // Scroll to the top of the view. This will allow users
    // to browse newly loaded content after e.g. clicking a pager
    // link.
    var offset = $element.offset();
    // We can't guarantee that the scrollable object should be
    // the body, as the view could be embedded in something
    // more complex such as a modal popup. Recurse up the DOM
    // and scroll the first element that has a non-zero top.
    var $scrollTarget = $element;
    while ($scrollTarget.scrollTop() === 0 && $($scrollTarget).parent()) {
      $scrollTarget = $scrollTarget.parent();
    }

    if (target === 'page' && $scrollTarget.length && $scrollTarget[0].tagName === 'HTML') {
      // Scroll to top when scroll target is the entire page.
      // @see https://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
      var rect = $($scrollTarget)[0].getBoundingClientRect();
      if (!(rect.top >= 0 && rect.left >= 0 && rect.bottom <= $(window).height() && rect.right <= $(window).width())) {
        $scrollTarget.animate({scrollTop: 0}, 500);
      }
    }
    else {
      // Only scroll upward.
      if (offset.top - Drupal.webform.scrollTopOffset < $scrollTarget.scrollTop()) {
        $scrollTarget.animate({scrollTop: (offset.top - Drupal.webform.scrollTopOffset)}, 500);
      }
    }
  };

  /**
   * Scroll element into view.
   *
   * @param {jQuery} $element
   *   An element.
   */
  Drupal.webformScrolledIntoView = function ($element) {
    if (!Drupal.webformIsScrolledIntoView($element)) {
      $('html, body').animate({scrollTop: $element.offset().top - Drupal.webform.scrollTopOffset}, 500);
    }
  };

  /**
   * Determine if element is visible in the viewport.
   *
   * @param {Element} element
   *   An element.
   *
   * @return {boolean}
   *   TRUE if element is visible in the viewport.
   *
   * @see https://stackoverflow.com/questions/487073/check-if-element-is-visible-after-scrolling
   */
  Drupal.webformIsScrolledIntoView = function (element) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(element).offset().top;
    var elemBottom = elemTop + $(element).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
  };

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for webform cards.
 */

(function ($, Drupal) {

  'use strict';

  Drupal.webform = Drupal.webform || {};
  Drupal.webform.cards = Drupal.webform.cards || {};
  // Autoforward (defaults to 1/4 second delay).
  Drupal.webform.cards.autoForwardDelay = Drupal.webform.cards.autoForwardDelay || 250;

  /**
   * Initialize webform cards.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformCards = {
    attach: function (context) {
      // Determine if the form is the context or it is within the context.
      var $forms = $(context).is('form.webform-submission-form')
        ? $(context)
        : $('form.webform-submission-form', context);

      $(once('webform-cards', $forms)).each(function () {
        // Form.
        var $form = $(this);

        // Options from data-* attributes.
        var options = {
          progressStates: $form[0].hasAttribute('data-progress-states'),
          progressLink: $form[0].hasAttribute('data-progress-link'),
          autoForward: $form[0].hasAttribute('data-auto-forward'),
          autoForwardHideNextButton: $form[0].hasAttribute('data-auto-forward-hide-next-button'),
          keyboard: $form[0].hasAttribute('data-keyboard'),
          previewLink: $form[0].hasAttribute('data-preview-link'),
          confirmation: $form[0].hasAttribute('data-confirmation'),
          track: $form.data('track'),
          toggle: $form[0].hasAttribute('data-toggle'),
          toggleHideLabel: $form.data('toggle-hide-label'),
          toggleShowLabel: $form.data('toggle-show-label'),
          ajaxEffect: $form.data('ajax-effect'),
          ajaxSpeed: $form.data('ajax-speed'),
          ajaxScrollTop: $form.data('ajax-scroll-top')
        };

        var currentPage = $form.data('current-page');

        // Progress.
        var $progress = $('.webform-progress');

        // Current card.
        var $currentCardInput = $form.find(':input[name="current_card"]');

        // Cards.
        var $allCards = $form.find('.webform-card');

        // Actions and buttons.
        var $formActions = $form.find('.form-actions').show();
        var $previewButton = $formActions.find('.webform-button--preview');
        var $submitButton = $formActions.find('.webform-button--submit');
        var $previousButton = $formActions.find('.webform-button--previous');
        var $nextButton = $formActions.find('.webform-button--next');

        // Preview.
        if (!$allCards.length) {
          setPreview();
          return;
        }

        // Display show/hide all cards link.
        if (options.toggle) {
          setToggle();
        }

        // Server-side validation errors.
        // @see \Drupal\Core\Render\Element\RenderElement::setAttributes
        var $invalidCards = $allCards.filter(':has(.form-item--error-message)');
        if ($invalidCards.length) {
          // Hide progress.
          $form.find('.webform-progress').hide();
          // Hide next and previous and only show the submit button.
          $previousButton.hide();
          $nextButton.hide();
          // Show invalid cards and shake'em.
          $invalidCards.addClass('webform-card--error');
          shake($invalidCards);
          return;
        }

        // Previous and next buttons.
        $previousButton.data('default-label', $previousButton.val());
        $nextButton.data('default-label', $nextButton.val());
        $previousButton.on('click', previousButtonClickEventHandler).show();
        $nextButton.on('click', nextButtonClickEventHandler).show();

        // Auto-forward.
        if (options.autoForward) {
          // Auto-forward on enter.
          $form.find('input')
            .not(':button, :submit, :reset, :image, :file')
            .on('keydown', function (event) {
              if (event.which === 13) {
                autoForwardEventHandler(event);
                // Disable auto submit.
                // @see Drupal.behaviors.webformDisableAutoSubmit
                event.preventDefault();
                return false;
              }
            });

          // Auto-forward on change.
          $form.find('select[data-images]:not([multiple]), input[type="range"].form-webform-rating')
            .on('change', autoForwardEventHandler);

          // Auto-forward radios with label.
          $form.find('input:radio, label[for]')
            .on('mouseup', function (event) {
              var $radio = (event.target.tagName === 'LABEL')
                ? $('#' + $(event.target).attr('for'))
                : $(this);
              if ($radio.is(':radio') && $radio.val() !== '_other_') {
                setTimeout(function () {
                  autoForwardEventHandler(event);
                });
              }
            });
        }

        // Keyboard navigation.
        if (options.keyboard) {
          $('body').on('keydown', function (event) {
            // Only track left and right keys.
            if (event.which !== 37 && event.which !== 39) {
              return;
            }

            // If input and the cursor is not at the end of the input, do not
            // trigger navigation.
            // @see https://stackoverflow.com/questions/21177489/selectionstart-selectionend-on-input-type-number-no-longer-allowed-in-chrome
            if (typeof event.target.value !== 'undefined'
              && typeof event.target.selectionStart !== 'undefined'
              && event.target.selectionStart !== null) {
              if (event.target.value.length !== event.target.selectionStart) {
                return;
              }
              // Ignore the left keydown event if the input has a value.
              if (event.target.value.length && event.which === 37) {
                return;
              }
            }

            // If input[type="radio"] ignore left/right keys which are used to
            // navigate between radio buttons.
            if (event.target.tagName === 'INPUT' && event.target.type === 'radio') {
              return;
            }

            switch (event.which) {
              // Left key triggers the previous button.
              case 37:
                setTimeout(function () {$previousButton.trigger('click');}, Drupal.webform.cards.autoForwardDelay);
                break;

              // Right key triggers the next button.
              case 39:
                setTimeout(function () {$nextButton.trigger('click');}, Drupal.webform.cards.autoForwardDelay);
                break;
            }
          });
        }

        // Track when cards are hidden/shown via #states conditional logic.
        if (options.progressStates) {
          $(document).on('state:visible state:visible-slide', function stateVisibleEventHandler(e) {
            if ($(e.target).hasClass('webform-card') && $.contains($form[0], e.target)) {
              trackProgress();
              trackActions();
            }
          });
        }

        initialize();

        /* ****************************************************************** */
        // Private functions.
        /* ****************************************************************** */

        /**
         * Initialize the active card.
         */
        function initialize() {
          var currentCard = $currentCardInput.val();
          var $activeCard = currentCard ? $allCards.filter('[data-webform-key="' + currentCard + '"]') : [];
          if (!$activeCard.length) {
            $activeCard = $allCards.first();
          }
          setActiveCard($activeCard, true);
        }

        /**
         * Set the active card.
         *
         * @param {jQuery} $activeCard
         *   An jQuery object containing the active card.
         * @param {boolean} initialize
         *   Are cards being initialize.
         *   If TRUE, no transition or scrolling effects will be triggered.
         */
        function setActiveCard($activeCard, initialize) {
          if (!$activeCard.length) {
            return;
          }

          // Track the previous active card.
          var $prevCard = $allCards.filter('.webform-card--active');

          // Unset the previous active card and set the active card.
          $prevCard.removeClass('webform-card--active');
          $activeCard.addClass('webform-card--active');

          // Trigger card change event.
          $form.trigger('webform_cards:change', [$activeCard]);

          // Allow card change event to reset the active card, this allows for
          // card change event handler to apply custom validation
          // and conditional logic.
          $activeCard = $allCards.filter('.webform-card--active');
          if ($activeCard.get(0) === $prevCard.get(0)) {
            initialize = true;
          }

          // Show the active card.
          if (!initialize) {
            // Show the active card.
            applyAjaxEffect($activeCard);

            // Scroll to the top of the page or form.
            Drupal.webformScrollTop($activeCard, options.ajaxScrollTop);
          }

          // Focus the active card's first visible input.
          autofocus($activeCard);

          // Set current card.
          $currentCardInput.val($activeCard.data('webform-key'));
          $form.attr('data-webform-current-card', $activeCard.data('webform-key'));

          // Track the current page in a form data attribute and the URL.
          trackCurrentPage($activeCard);

          // Track progress.
          trackProgress();

          // Track actions.
          trackActions();
        }

        /**
         * Track the current page in a form data attribute and the URL.
         *
         * @param {jQuery} $activeCard
         *   An jQuery object containing the active card.
         *
         * @see \Drupal\webform\WebformSubmissionForm::form
         * @see Drupal.behaviors.webformWizardTrackPage
         */
        function trackCurrentPage($activeCard) {
          if (!options.track) {
            return;
          }

          var page = (options.track === 'index')
            ? ($allCards.index($activeCard) + 1)
            : $activeCard.data('webform-key');

          // Set form data attribute.
          $form.data('webform-wizard-current-page', page);

          // Set URL
          var url = window.location.toString();
          var regex = /([?&])page=[^?&]+/;
          if (url.match(regex)) {
            url = url.replace(regex, '$1page=' + page);
          }
          else {
            url = url + (url.indexOf('?') !== -1 ? '&page=' : '?page=') + page;
          }
          window.history.replaceState(null, null, url);
        }

        /**
         * Track actions
         */
        function trackActions() {
          var $activeCard = $allCards.filter('.webform-card--active');

          // Set the previous and next labels.
          setButtonLabel($previousButton, $activeCard.data('prev-button-label') || $previousButton.data('default-label'));
          setButtonLabel($nextButton, $activeCard.data('next-button-label') || $nextButton.data('default-label'));

          // Show/hide the previous button.
          var hasPrevCard = !!$activeCard.prevAll('.webform-card:not([style*="display: none"])').length;
          $previousButton.toggle(hasPrevCard);

          // Hide/show the next button and submit buttons.
          var hasNextCard = !!$activeCard.nextAll('.webform-card:not([style*="display: none"])').length;
          $previewButton.toggle(!hasNextCard);
          $submitButton.toggle(!hasNextCard);
          $nextButton.toggle(hasNextCard);

          // Hide the next button when auto-forwarding.
          if (hideAutoForwardNextButton()) {
            $nextButton.hide();
          }
        }

        /**
         * Track progress.
         *
         * @see webform/templates/webform-progress.html.twig
         * @see webform/templates/webform-progress-tracker.html.twig
         */
        function trackProgress() {
          // Hide/show cards and update steps.
          var cards = getCardsProgressSteps();
          for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var cardAttributeName = '[data-webform-' + card.type + '="' + card.key + '"]';

            var $cardStep = $progress.find(cardAttributeName);

            // Set card and page step.
            $cardStep.find('[data-webform-progress-step]').attr('data-text', card.step);
            if (card.type === 'page') {
              continue;
            }

            // Hide/show card step.
            $cardStep.toggle(!card.hidden);

            // Set .is-active and .is-complete classes.
            $cardStep.toggleClass('is-active', card.active);
            $cardStep.toggleClass('is-complete', !card.active && card.complete);

            // Set 'Current' and 'Complete' state.
            var $cardState = $cardStep.find('[data-webform-progress-state]');
            $cardState.toggle(card.active || card.complete);
            if (card.active) {
              $cardState.html(Drupal.t('Current'));
            }
            if (card.complete) {
              $cardState.html(Drupal.t('Complete'));
            }

            // Link card step.
            if (options.progressLink) {
              var $links = $cardStep.find('[data-webform-progress-link]');
              $links.data('webform-key', card.key);
              if (card.complete) {
                if ($links.attr('role') !== 'link') {
                  $links
                    .attr({'role': 'link', 'title': card.title, 'aria-label': card.title, 'tabindex': '0'})
                    .on('click', function () {
                      var $card = $allCards.filter('[data-webform-key="' + $(this).data('webform-key') + '"]');
                      setActiveCard($card);
                    })
                    .on('keydown', function (event) {
                      if (event.which === 13) {
                        var $card = $allCards.filter('[data-webform-key="' + $(this).data('webform-key') + '"]');
                        setActiveCard($card);
                      }
                    });
                }
              }
              else if ($links.attr('role') === 'link') {
                $links.removeAttr('role title aria-label tabindex')
                  .off('click keydown');
              }
            }
          }

          // Set properties.
          var properties = getCardsProgressProperties();
          for (var property in properties) {
            if (properties.hasOwnProperty(property)) {
              var attribute = '[data-webform-progress-' + property + ']';
              var value = properties[property];
              $progress.find(attribute).html(value);
            }
          }

          // Set <progress> tag [value] and [max] attributes.
          $progress.find('progress').attr({
            value: properties.index,
            max: properties.total
          });
        }

        /**
         * Set show/hide all cards toggle button.
         */
        function setToggle() {
          var $toggle = $('<button type="button" class="webform-cards-toggle"></button>')
            .html(options.toggleShowLabel)
            .on('click', toggleEventHandler)
            .wrap('<div class="webform-cards-toggle-wrapper"></div>')
            .parent();
          $allCards.eq(0).before($toggle);
        }

        /**
         * Set preview.
         */
        function setPreview() {
          if (currentPage !== 'webform_preview' || !$form.find('.webform-preview').length) {
            return;
          }

          if (options.keyboard) {
            $('body').on('keydown', function (event) {
              switch (event.which) {
                case 37: // left.
                  setTimeout(function () {$previousButton.trigger('click');}, Drupal.webform.cards.autoForwardDelay);
                  break;

                case 39: // right
                  setTimeout(function () {$submitButton.trigger('click');}, Drupal.webform.cards.autoForwardDelay);
                  break;
              }
            });
          }
          setPreviewLinks();
        }

        /**
         * Set links to previous pages/cards in preview.
         */
        function setPreviewLinks() {
          var $button = $form.find('.js-webform-wizard-pages-link[data-webform-page="webform_start"]');

          // Link to previous pages in progress steps (aka bar).
          if (options.progressLink) {
            $progress.find('[data-webform-card]').each(function () {
              var $step = $(this);
              var card = $step.data('webform-card');
              var title = $step.attr('title');
              $step
                .find('[data-webform-progress-link]')
                .attr({'role': 'link', 'title': title, 'aria-label': title, 'tabindex': '0'})
                .on('click', function () {
                  // Set current card.
                  $currentCardInput.val(card);
                  // Click button to return to the 'webform_start' page.
                  $button.trigger('click');
                })
                .on('keydown', function (event) {
                  if (event.which === 13) {
                    $(this).trigger('click');
                  }
                });
            });
          }

          // Link to previous pages in preview.
          if (options.previewLink) {
            $form
              .find('.webform-card-edit[data-webform-card]')
              .each(function appendEditButton() {
                var $card = $(this);

                var card = $card.data('webform-card');
                var title = $card.attr('title');

                var $cardButton = $button.clone();
                $cardButton
                  .removeAttr('data-webform-page data-msg-required')
                  .attr('id', $cardButton.attr('id') + '-' + card)
                  .attr('name', $cardButton.attr('name') + '-' + card)
                  .attr('data-drupal-selector', $cardButton.attr('data-drupal-selector') + '-' + card)
                  .attr('title', Drupal.t("Edit '@title'", {'@title': title}).toString())
                  .on('click', function () {
                    // Set current card.
                    $currentCardInput.val(card);
                    // Click button to return to the 'webform_start' page.
                    $button.trigger('click');
                    return false;
                  });
                $card.append($cardButton).show();
              });
          }
        }

        /**
         * Get cards progress properties.
         *
         * Properties include index, total, percentage, and summary.
         *
         * @return {{summary: string, total: number, percentage: string,
         *   index: *}} Cards progress properties.
         */
        function getCardsProgressProperties() {
          var $activeCard = $allCards.filter('.webform-card--active');

          var $visibleCards = $allCards.filter(':not([style*="display: none"])');

          var index = (currentPage === 'webform_preview')
            ? $visibleCards.length + 1
            : $visibleCards.index($activeCard);

          var total = $visibleCards.length
            + ($previewButton.length ? 1 : 0)
            + (options.confirmation ? 1 : 0);

          var percentage = Math.round((index / (total - 1)) * 100);

          var summary = Drupal.t(
            '@index of @total',
            {'@index': index + 1, '@total': total}
          );

          return {
            index: index + 1,
            total: total,
            percentage: percentage + '%',
            summary: summary
          };
        }

        /**
         * Get cards as progress steps.
         *
         * @return {[]}
         *   Cards as progress steps.
         */
        function getCardsProgressSteps() {
          var $activeCard = $allCards.filter('.webform-card--active');
          var activeKey = $activeCard.data('webform-key');

          var cards = [];

          // Append cards.
          var step = 0;
          var isComplete = true;
          $allCards.each(function () {
            var $card = $(this);
            var key = $card.data('webform-key');
            var title = $card.data('title');

            // Set active and complete classes.
            var isActive = (activeKey === key);
            if (isActive) {
              isComplete = false;
            }

            // Hide/show progress based on conditional logic.
            var isHidden = false;
            if (options.progressStates) {
              isHidden = $card.is('[style*="display: none"]');
              if (!isHidden) {
                step++;
              }
            }
            else {
              step++;
            }

            cards.push({
              type: 'card',
              key: key,
              title: title,
              step: isHidden ? null : step,
              hidden: isHidden,
              active: isActive,
              complete: isComplete
            });
          });

          // Append preview and confirmation pages.
          $(['webform_preview', 'webform_confirmation']).each(function () {
            var $progressStep = $form.find('[data-webform-progress-steps] [data-webform-page="' + this + '"]');
            if ($progressStep.length) {
              step++;
              cards.push({
                type: 'page',
                key: this,
                step: step
              });
            }
          });
          return cards;
        }

        /**
         * Apply Ajax effect to elements.
         *
         * @param {jQuery} $elements
         *   An jQuery object containing elements to be displayed.
         */
        function applyAjaxEffect($elements) {
          switch (options.ajaxEffect) {
            case 'fade':
              $elements.hide().fadeIn(options.ajaxSpeed);
              break;

            case 'slide':
              $elements.hide().slideDown(options.ajaxSpeed);
              break;
          }
        }

        /* ****************************************************************** */
        // Event handlers.
        /* ****************************************************************** */

        /**
         * Toggle event handler.
         *
         * @param {jQuery.Event} event
         *   The event triggered.
         */
        function toggleEventHandler(event) {
          if ($form.hasClass('webform-cards-toggle-show')) {
            $form.removeClass('webform-cards-toggle-show');
            $(this)
              .attr('title', options.toggleShowLabel)
              .html(options.toggleShowLabel);
            var $activeCard = $allCards.filter('.webform-card--active');
            setActiveCard($activeCard);
          }
          else {
            $form.addClass('webform-cards-toggle-show');
            $(this)
              .attr('title', options.toggleHideLabel)
              .html(options.toggleHideLabel);
            var $visibleCards = $allCards.filter(':not([style*="display: none"])');
            applyAjaxEffect($visibleCards);
            $nextButton.hide();
            $previousButton.hide();
            $previewButton.show();
            $submitButton.show();

            // Trigger card change event with no active card.
            $form.trigger('webform_cards:change');
          }
        }

        /**
         * Previous button event handler.
         *
         * @param {jQuery.Event} event
         *   The event triggered.
         */
        function previousButtonClickEventHandler(event) {
          // Get previous visible card (not "display: none").
          var $previousCard = $allCards.filter('.webform-card--active')
            .prevAll('.webform-card:not([style*="display: none"])')
            .first();
          setActiveCard($previousCard);
          // Prevent the button's default behavior.
          event.preventDefault();
        }

        /**
         * Next button event handler.
         *
         * @param {jQuery.Event} event
         *   The event triggered.
         */
        function nextButtonClickEventHandler(event) {
          var validator = $form.validate(drupalSettings.cvJqueryValidateOptions);
          if (!$form.valid()) {
            // Focus first invalid input.
            validator.focusInvalid();
            // Shake the invalid card.
            var $activeCard = $allCards.filter('.webform-card--active');
            shake($activeCard);
          }
          else {
            // Get next visible card (not "display: none").
            var $nextCard = $allCards.filter('.webform-card--active')
              .nextAll('.webform-card:not([style*="display: none"])')
              .first();
            if ($nextCard.length) {
              setActiveCard($nextCard);
            }
            else if ($previewButton.length) {
              $previewButton.trigger('click');
            }
            else {
              $submitButton.trigger('click');
            }
          }
          // Prevent the button's default behavior.
          event.preventDefault();
        }

        /**
         * Auto forward event handler.
         *
         * @param {jQuery.Event} event
         *   The event triggered.
         */
        function autoForwardEventHandler(event) {
          if ($form.hasClass('webform-cards-toggle-show')) {
            return;
          }

          var $activeCard = $allCards.filter('.webform-card--active');
          var $allInputs = $activeCard.find('input:visible, select:visible, textarea:visible');
          var $autoForwardInputs = $activeCard.find('input:visible, select:visible');
          if (!$autoForwardInputs.length || $allInputs.length !== $autoForwardInputs.length) {
            return;
          }

          var inputValues = [];
          $autoForwardInputs.each(function () {
            var name = this.name;
            if (!(name in inputValues)) {
              inputValues[name] = false;
            }
            if (this.type === 'radio' && this.checked) {
              inputValues[name] = true;
            }
            else if (this.type === 'select-one' && this.selectedIndex !== -1) {
              inputValues[name] = true;
            }
            else if (this.type === 'range' && this.value) {
              inputValues[name] = true;
            }
          });

          // Only auto-forward when a single input is visible.
          if (Object.keys(inputValues).length > 1) {
            return;
          }

          var inputHasValue = inputValues.every(function (value) {
            return value;
          });
          if (inputHasValue) {
            setTimeout(function () {$nextButton.trigger('click');}, Drupal.webform.cards.autoForwardDelay);
          }
        }

        /**
         * Determine if next button is hidden when auto-forwarding
         *
         * @return {{boolean}}
         *   TRUE if next button should be hidden
         */
        function hideAutoForwardNextButton() {
          if (!options.autoForwardHideNextButton) {
            return false;
          }

          if ($form.hasClass('webform-cards-toggle-show')) {
            return false;
          }

          var $activeCard = $allCards.filter('.webform-card--active');
          var $allInputs = $activeCard.find('input:visible, select:visible, textarea:visible');
          var $autoForwardInputs = $activeCard.find('input[type="radio"], select[data-images]:not([multiple]), input[type="range"].form-webform-rating');
          if (!$autoForwardInputs.length || $allInputs.length !== $autoForwardInputs.length) {
            return false;
          }

          var inputValues = [];
          var name;
          var type;
          $autoForwardInputs.each(function () {
            name = this.name;
            type = this.type;
            if (type === 'radio') {
              inputValues[name] = 'radio';
            }
            else if (type === 'select-one') {
              inputValues[name] = 'select-one';
            }
            else if (type === 'range') {
              inputValues[name] = 'range';
            }
          });

          // Only auto-forward when a single input is visible.
          if (Object.keys(inputValues).length !== 1) {
            return false;
          }

          // Determine if the auto-forward input has a value.
          switch (type) {
            case 'radio':
              return $('[name="' + name + '"]:checked').length ? false : true;

            case 'range':
              return $('[name="' + name + '"]').val() !== '0' ? false : true;

            case 'select-one':
              return $('[name="' + name + '"]').val() ? false : true;
          }
        }

        /**
         * Auto focus a card's first input, if it has not been entered.
         *
         * @param {jQuery} $activeCard
         *   An jQuery object containing the active card.
         *
         */
        function autofocus($activeCard) {
          if (!$form.hasClass('js-webform-autofocus')) {
            return;
          }

          var $firstInput = $activeCard.find(':input:visible:not([type="submit"])').first();
          if ($firstInput.length && !inputHasValue($firstInput)) {
            $firstInput.trigger('focus');
          }
        }

        /**
         * Shake an element.
         *
         * @param {jQuery} $element
         *   A jQuery object containing an element to shake.
         *
         * @see https://stackoverflow.com/questions/4399005/implementing-jquerys-shake-effect-with-animate
         */
        function shake($element) {
          var intShakes = 3;
          var intDistance = 20;
          var intDuration = 450;
          $element.css('position', 'relative');
          for (var x = 1; x <= intShakes; x++) {
            $element
              .animate({left: (intDistance * -1)}, ((intDuration / intShakes) / 4))
              .animate({left: intDistance}, ((intDuration / intShakes) / 2))
              .animate({left: 0}, ((intDuration / intShakes) / 4));
          }
        }

        /**
         * Determine if an input has been entered.
         *
         * @param {jQuery} $input
         *   An jQuery object containing an :input.
         *
         * @return {boolean}
         *   TRUE if next button should be hidden
         */
        function inputHasValue($input) {
          var type = $input[0].type;
          var name = $input[0].name;
          switch (type) {
            case 'checkbox':
            case 'radio':
              return $('[name="' + name + '"]:checked').length ? true : false;

            case 'range':
              return $('[name="' + name + '"]').val() !== '0' ? true : false;

            case 'select-one':
            default:
              return $('[name="' + name + '"]').val() ? true : false;
          }
        }

        /**
         * Set button label value or HTML markup.
         *
         * @param {jQuery} $button
         *   A jQuery object containing a <button> or <input type="submit">.
         * @param {string} label
         *   The button's label.
         */
        function setButtonLabel($button, label) {
          if ($button[0].tagName === 'BUTTON') {
            $button.html(label);
          }
          else {
            $button.val(label);
          }
        }
      });

    }
  };

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behavior to remove destination from contextual links.
 */

(function ($, once) {

  'use strict';

  // Bind click event to all .contextual links which are
  // dynamically inserted via Ajax.
  // @see webform_contextual_links_view_alter()
  // @see Drupal.behaviors.contextual
  $(document).on('click', '.contextual', function () {
    $(once('webform-contextual', 'a.webform-contextual', this)).each(function () {
      this.href = this.href.split('?')[0];

      // Add ?_webform_test={webform} to the current page's URL.
      // phpcs:ignore
      if (/webform\/([^/]+)\/test$/.test(this.href)) {
        this.href = window.location.pathname + '?_webform_test=' + RegExp.$1;
      }
    });
  });

})(jQuery, once);
;
/**
 * @file
 * JavaScript behaviors for message element integration.
 */

(function ($, Drupal, once) {

  'use strict';

  // Determine if local storage exists and is enabled.
  // This approach is copied from Modernizr.
  // @see https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731
  var hasLocalStorage = (function () {
    try {
      localStorage.setItem('webform', 'webform');
      localStorage.removeItem('webform');
      return true;
    }
    catch (e) {
      return false;
    }
  }());

  // Determine if session storage exists and is enabled.
  // This approach is copied from Modernizr.
  // @see https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731
  var hasSessionStorage = (function () {
    try {
      sessionStorage.setItem('webform', 'webform');
      sessionStorage.removeItem('webform');
      return true;
    }
    catch (e) {
      return false;
    }
  }());

  /**
   * Behavior for handler message close.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformMessageClose = {
    attach: function (context) {
      $(once('webform-message--close', '.js-webform-message--close', context)).each(function () {
        var $element = $(this);

        var id = $element.attr('data-message-id');
        var storage = $element.attr('data-message-storage');
        var effect = $element.attr('data-message-close-effect') || 'hide';
        switch (effect) {
          case 'slide': effect = 'slideUp'; break;

          case 'fade': effect = 'fadeOut'; break;
        }

        // Check storage status.
        if (isClosed($element, storage, id)) {
          return;
        }

        // Only show element if it's style is not set to 'display: none'
        // and it is not hidden via .js-webform-states-hidden.
        if ($element.attr('style') !== 'display: none;' && !$element.hasClass('js-webform-states-hidden')) {
          $element.show();
        }

        $element.find('.js-webform-message__link').on('click', function (event) {
          $element[effect]();
          setClosed($element, storage, id);
          $element.trigger('close');
          event.preventDefault();
        });
      });
    }
  };

  function isClosed($element, storage, id) {
    if (!id || !storage) {
      return false;
    }

    switch (storage) {
      case 'local':
        if (hasLocalStorage) {
          return localStorage.getItem('Drupal.webform.message.' + id) || false;
        }
        return false;

      case 'session':
        if (hasSessionStorage) {
          return sessionStorage.getItem('Drupal.webform.message.' + id) || false;
        }
        return false;

      default:
        return false;
    }
  }

  function setClosed($element, storage, id) {
    if (!id || !storage) {
      return;
    }

    switch (storage) {
      case 'local':
        if (hasLocalStorage) {
          localStorage.setItem('Drupal.webform.message.' + id, true);
        }
        break;

      case 'session':
        if (hasSessionStorage) {
          sessionStorage.setItem('Drupal.webform.message.' + id, true);
        }
        break;

      case 'user':
      case 'state':
      case 'custom':
        $.get($element.find('.js-webform-message__link').attr('href'));
        return true;
    }
  }

})(jQuery, Drupal, once);
;
