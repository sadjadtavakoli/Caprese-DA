#ifndef __LIBJVMCICOMPILER_H
#define __LIBJVMCICOMPILER_H

#include <graal_isolate.h>


#if defined(__cplusplus)
extern "C" {
#endif

void * Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_pollRegistrations(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId);

void Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_finishRegistration(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, void * handles);

void * Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_getObjectName(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

void * Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_getMBeanInfo(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

void * Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_getAttributes(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * requiredAttributes);

void * Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_setAttributes(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * attributes);

void * Java_org_graalvm_compiler_hotspot_management_JMXToLibGraalCalls_invoke(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * hsActionName, void * hsParams, void * hsSignature);

void Java_org_graalvm_libgraal_LibGraalScope_detachThreadFrom(void * env, void * hsClazz, long long int isolateThread);

graal_isolatethread_t* Java_org_graalvm_libgraal_LibGraalScope_getIsolateThreadIn(void * env, void * hsClazz, graal_isolate_t* isolate);

long long int Java_org_graalvm_libgraal_LibGraalScope_attachThreadTo(void * env, void * hsClazz, long long int isolate);

int Java_org_graalvm_libgraal_LibGraalObject_releaseHandle(void * jniEnv, void * jclass, long long int isolateThreadId, long long int handle);

long long int Java_org_graalvm_compiler_hotspot_test_CompileTheWorld_compileMethodInLibgraal(void * jniEnv, void * jclass, long long int isolateThread, long long int methodHandle, int useProfilingInfo, int installAsDefault, long long int optionsAddress, int optionsSize, int optionsHash, long long int stackTraceAddress, int stackTraceCapacity);

long long int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_initializeRuntime(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, void * truffleRuntime, long long int classLoaderDelegateId);

long long int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_newCompiler(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int truffleRuntimeHandle);

void Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_initializeCompiler(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilerHandle, void * hsOptions, void * hsCompilable, int firstInitialization);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getCompilerConfigurationFactoryName(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int truffleRuntimeHandle);

long long int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_openCompilation(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * hsCompilable);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getCompilerConfigurationName(struct JNIEnv_* env, void * hsClazz, long long int isolateId, long long int handle);

void Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_doCompile(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilerHandle, long long int debugContextHandle, long long int compilationHandle, void * hsOptions, void * hsInlining, void * hsTask, void * hsListener);

void Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_closeCompilation(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilationHandle);

void Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_shutdown(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

void Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_installTruffleCallBoundaryMethods(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * hsCompilable);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_pendingTransferToInterpreterOffset(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * hsCompilable);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getGraphDumpDirectory(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getInitialOptions(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int truffleRuntimeHandle);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getSuppliedString(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getNodeCount(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getNodeTypes(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, int simpleNames);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getTargetCodeSize(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getTotalFrameSize(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getExceptionHandlersCount(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getInfopointsCount(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getInfopoints(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getMarksCount(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getDataPatchesCount(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

long long int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_openDebugContext(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilerHandle, long long int compilationHandle, void * hsOptions);

long long int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_openDebugContextScope(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle, void * hsName, long long int compilationHandle);

void Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_closeDebugContext(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

void Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_closeDebugContextScope(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_isBasicDumpEnabled(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int handle);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getTruffleCompilationTruffleAST(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilationHandle);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getTruffleCompilationId(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int compilationHandle);

long long int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getDumpChannel(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int debugContextHandle);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getVersionProperties(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_isDumpChannelOpen(struct JNIEnv_* env, void * hsClazz, long long int isolateThreadId, long long int channelHandle);

int Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_dumpChannelWrite(struct JNIEnv_* env, void * hsClass, long long int isolateThreadId, long long int channelHandle, void * hsSource, int capacity, int position, int limit);

void Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_dumpChannelClose(struct JNIEnv_* env, void * hsClass, long long int isolateThreadId, long long int channelHandle);

void Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_ttyWriteByte(struct JNIEnv_* env, void * hsClass, long long int isolateThreadId, int b);

void Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_ttyWriteBytes(struct JNIEnv_* env, void * hsClass, long long int isolateThreadId, void * array, int off, int len);

void * Java_org_graalvm_compiler_truffle_runtime_hotspot_libgraal_TruffleToLibGraalCalls_getExecutionID(struct JNIEnv_* env, void * hsClass, long long int isolateThreadId);

void vmLocatorSymbol(graal_isolatethread_t* thread);

#if defined(__cplusplus)
}
#endif
#endif
