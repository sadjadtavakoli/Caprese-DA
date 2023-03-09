/* *****************************************************************************
 * Copyright 2018 Dynamic Analysis Group, Università della Svizzera Italiana (USI)
 * Copyright (c) 2018, 2020, Oracle and/or its affiliates. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * *****************************************************************************/
package ch.usi.inf.nodeprof.handlers;

import com.oracle.truffle.api.instrumentation.EventContext;
import com.oracle.truffle.js.nodes.instrumentation.JSTags.DeclareTag;
import com.oracle.truffle.js.nodes.instrumentation.JSTags.LiteralTag;

import ch.usi.inf.nodeprof.ProfiledTagEnum;

/**
 * Abstract event handler for literal events
 */
public abstract class DeclareEventHandler extends BaseSingleTagEventHandler {
    private final String declareType;
    private final String declareName;
    private final boolean isFunctionDeclaration;

    public DeclareEventHandler(EventContext context) {
        super(context, ProfiledTagEnum.DECLARE);
        this.declareType = (String) getAttribute(DeclareTag.TYPE);
        this.declareName = (String) getAttribute(DeclareTag.NAME);
        this.isFunctionDeclaration = LiteralTag.Type.FunctionLiteral.name().equals(getAttributeOrNull(LiteralTag.TYPE));
    }

    /**
     * @return type of the declaration, including let, const and var
     */
    public String getDeclareType() {
        return this.declareType;
    }

    /**
     * @return name of the declared variable
     */
    public String getDeclareName() {
        return this.declareName;
    }

    public boolean isFunctionDeclaration() {
        return this.isFunctionDeclaration;
    }
}
