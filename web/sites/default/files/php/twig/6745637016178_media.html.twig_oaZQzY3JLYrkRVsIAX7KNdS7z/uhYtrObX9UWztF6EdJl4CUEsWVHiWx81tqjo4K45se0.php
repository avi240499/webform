<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Extension\SandboxExtension;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;

/* core/themes/olivero/templates/content/media.html.twig */
class __TwigTemplate_3957150be52012b364a99cad7045e160 extends Template
{
    private $source;
    private $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->parent = false;

        $this->blocks = [
        ];
        $this->sandbox = $this->env->getExtension('\Twig\Extension\SandboxExtension');
        $this->checkSecurity();
    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 18
        $context["classes"] = [0 => "media", 1 => ("media--type-" . \Drupal\Component\Utility\Html::getClass($this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source,         // line 20
($context["media"] ?? null), "bundle", [], "method", false, false, true, 20), 20, $this->source))), 2 => (( !twig_get_attribute($this->env, $this->source,         // line 21
($context["media"] ?? null), "isPublished", [], "method", false, false, true, 21)) ? ("media--unpublished") : ("")), 3 => ((        // line 22
($context["view_mode"] ?? null)) ? (("media--view-mode-" . \Drupal\Component\Utility\Html::getClass($this->sandbox->ensureToStringAllowed(($context["view_mode"] ?? null), 22, $this->source)))) : (""))];
        // line 25
        echo "<div";
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, ($context["attributes"] ?? null), "addClass", [0 => ($context["classes"] ?? null)], "method", false, false, true, 25), 25, $this->source), "html", null, true);
        echo ">
  ";
        // line 26
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, ($context["title_suffix"] ?? null), "contextual_links", [], "any", false, false, true, 26), 26, $this->source), "html", null, true);
        echo "
  ";
        // line 27
        if (($context["content"] ?? null)) {
            // line 28
            echo "    ";
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["content"] ?? null), 28, $this->source), "html", null, true);
            echo "
  ";
        }
        // line 30
        echo "</div>
";
    }

    public function getTemplateName()
    {
        return "core/themes/olivero/templates/content/media.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  61 => 30,  55 => 28,  53 => 27,  49 => 26,  44 => 25,  42 => 22,  41 => 21,  40 => 20,  39 => 18,);
    }

    public function getSourceContext()
    {
        return new Source("", "core/themes/olivero/templates/content/media.html.twig", "/var/www/html/D10/web/core/themes/olivero/templates/content/media.html.twig");
    }
    
    public function checkSecurity()
    {
        static $tags = array("set" => 18, "if" => 27);
        static $filters = array("clean_class" => 20, "escape" => 25);
        static $functions = array();

        try {
            $this->sandbox->checkSecurity(
                ['set', 'if'],
                ['clean_class', 'escape'],
                []
            );
        } catch (SecurityError $e) {
            $e->setSourceContext($this->source);

            if ($e instanceof SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

    }
}
