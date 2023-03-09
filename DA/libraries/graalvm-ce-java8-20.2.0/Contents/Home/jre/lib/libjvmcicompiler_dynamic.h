#ifndef __LIBJVMCICOMPILER_H
#define __LIBJVMCICOMPILER_H

#include <graal_isolate_dynamic.h>


#if defined(__cplusplus)
extern "C" {
#endif

typedef void * (*Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_pollRegistrations_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId);

typedef void (*Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_finishRegistration_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, void * handles);

typedef void * (*Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_getObjectName_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef void * (*Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_getMBeanInfo_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef void * (*Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_getAttributes_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * requiredAttributes);

typedef void * (*Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_setAttributes_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * attributes);

typedef void * (*Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_invoke_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * hsActionName, void * hsParams, void * hsSignature);

typedef void (*Java_org_graalvm_libgraal_LibGraalScope_detachThreadFrom_fn_t)(void * env, void * hsClazz, long long int isolateThread);

typedef graal_isolatethread_t* (*Java_org_graalvm_libgraal_LibGraalScope_getIsolateThreadIn_fn_t)(void * env, void * hsClazz, graal_isolate_t* isolate);

typedef long long int (*Java_org_graalvm_libgraal_LibGraalScope_attachThreadTo_fn_t)(void * env, void * hsClazz, long long int isolate);

typedef int (*Java_org_graalvm_libgraal_LibGraalObject_releaseHandle_fn_t)(void * jniEnv, void * jclass, long long int isolateThreadId, long long int handle);

typedef long long int (*Java_org_graalvm_compiler_hotspot_test_CompileTheWorld_compileMethodInLibgraal_fn_t)(void * jniEnv, void * jclass, long long int isolateThread, long long int methodHandle, int useProfilingInfo, int installAsDefault, long long int optionsAddress, int optionsSize, int optionsHash, long long int stackTraceAddress, int stackTraceCapacity);

typedef long long int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_initializeRuntime_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, void * truffleRuntime, long long int classLoaderDelegateId);

typedef long long int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_newCompiler_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int truffleRuntimeHandle);

typedef void (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_initializeCompiler_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilerHandle, void * hsOptions, void * hsCompilable, int firstInitialization);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getCompilerConfigurationFactoryName_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int truffleRuntimeHandle);

typedef long long int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_openCompilation_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * hsCompilable);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getCompilerConfigurationName_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateId, long long int handle);

typedef void (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_doCompile_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilerHandle, long long int debugContextHandle, long long int compilationHandle, void * hsOptions, void * hsInlining, void * hsTask, void * hsListener);

typedef void (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_closeCompilation_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilationHandle);

typedef void (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_shutdown_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef void (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_installTruffleCallBoundaryMethods_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * hsCompilable);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_pendingTransferToInterpreterOffset_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * hsCompilable);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getGraphDumpDirectory_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getInitialOptions_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int truffleRuntimeHandle);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getSuppliedString_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getNodeCount_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getNodeTypes_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, int simpleNames);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getTargetCodeSize_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getTotalFrameSize_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getExceptionHandlersCount_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getInfopointsCount_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getInfopoints_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getMarksCount_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getDataPatchesCount_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef long long int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_openDebugContext_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilerHandle, long long int compilationHandle, void * hsOptions);

typedef long long int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_openDebugContextScope_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * hsName, long long int compilationHandle);

typedef void (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_closeDebugContext_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef void (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_closeDebugContextScope_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_isBasicDumpEnabled_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getTruffleCompilationTruffleAST_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilationHandle);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getTruffleCompilationId_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilationHandle);

typedef long long int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getDumpChannel_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int debugContextHandle);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getVersionProperties_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_isDumpChannelOpen_fn_t)(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int channelHandle);

typedef int (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_dumpChannelWrite_fn_t)(struct JNIEnv_* env, void * hsClass, long long int isolateThreadId, long long int channelHandle, void * hsSource, int capacity, int position, int limit);

typedef void (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_dumpChannelClose_fn_t)(struct JNIEnv_* env, void * hsClass, long long int isolateThreadId, long long int channelHandle);

typedef void (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_ttyWriteByte_fn_t)(struct JNIEnv_* env, void * hsClass, long long int isolateThreadId, int b);

typedef void (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_ttyWriteBytes_fn_t)(struct JNIEnv_* env, void * hsClass, long long int isolateThreadId, void * array, int off, int len);

typedef void * (*Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getExecutionID_fn_t)(struct JNIEnv_* env, void * hsClass, long long int isolateThreadId);

typedef void (*vmLocatorSymbol_fn_t)(graal_isolatethread_t* thread);

#if defined(__cplusplus)
}
#endif
#endif
