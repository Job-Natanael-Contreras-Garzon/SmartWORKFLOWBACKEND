package com.example.smartworkflow.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Anotación para inyectar automáticamente el orgId del tenant actual en los controladores.
 * El HandlerMethodArgumentResolver interceptará esta anotación y extraerá el ID 
 * desde el SecurityContext (poblado previamente por el filtro JWT).
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentOrg {
}