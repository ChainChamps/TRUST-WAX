project(trust)

find_package(cdt)

add_contract( trust trust trust.cpp )
target_include_directories( trust PUBLIC ${CMAKE_SOURCE_DIR}/../include )